/**
 * POST /api/trigger-webhook/[id] — Webhook 接收端 (v2)
 *
 * 外部系统 POST 到此地址触发自动化流程：
 *   1. 根据 webhookUrl 查找对应的工作流
 *   2. 校验 secretToken（如果配置了）
 *   3. 解析请求体中的 content 字段
 *   4. 使用 DAG 执行引擎按拓扑序执行所有节点
 */

import { NextResponse } from 'next/server';
import { findWorkflowByWebhookUrl } from '@/lib/workflow-store';
import { bitableService } from '@/services/feishu-bitable';
import { executeWorkflow } from '@/lib/workflow-engine/executor';

/** 递归扁平化对象 key：{a:{b:1}, c:2} → ["a.b","c"] */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const record = obj as Record<string, unknown>;
  const keys: string[] = [];
  for (const [k, v] of Object.entries(record)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** 按点号路径从嵌套对象取值 */
function getNestedValue(obj: Record<string, unknown>, dottedKey: string): unknown {
  const parts = dottedKey.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** 序列化时裁剪超长字符串（避免 base64 图片撑爆日志） */
function safeStringify(obj: unknown, max = 120): string {
  try {
    return JSON.stringify(obj, (_k, v) =>
      typeof v === 'string' && v.length > max ? `${v.slice(0, max)}…(${v.length}字节)` : v,
    );
  } catch {
    return String(obj);
  }
}

/**
 * 手动解析 multipart/form-data，作为 request.formData() 的兜底。
 * 兼容 iOS 等非常规格式：缺结尾 '--'、换行符为 \n 而非 \r\n 等。
 * 返回 [字段名, 值]，值类型为 string（文本）或 {__file,mime,data}（文件）。
 */
type ManualPart = string | { __file: true; mime: string; data: Buffer };
function parseMultipartManual(buf: Buffer, ct: string): [string, ManualPart][] {
  const bm = /boundary=("?)([^";]+)\1/i.exec(ct);
  if (!bm) return [];
  const boundary = bm[2];
  const delim = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = buf.indexOf(delim);
  if (start === -1) return [];
  start += delim.length;
  while (start < buf.length) {
    if (buf[start] === 0x0d) start++;
    if (buf[start] === 0x0a) start++;
    let end = buf.indexOf(delim, start);
    if (end === -1) end = buf.length;
    // 结尾边界（--boundary--）则停止
    if (buf[start] === 0x2d && buf[start + 1] === 0x2d) break;
    const part = buf.slice(start, end);
    let pEnd = part.length;
    if (part[pEnd - 1] === 0x0a) pEnd--;
    if (part[pEnd - 1] === 0x0d) pEnd--;
    if (pEnd > 0) parts.push(part.slice(0, pEnd));
    start = end + delim.length;
  }
  const result: [string, ManualPart][] = [];
  for (const part of parts) {
    const sep1 = part.indexOf('\r\n\r\n');
    let headerEnd: number;
    let bodyStart: number;
    if (sep1 !== -1) { headerEnd = sep1; bodyStart = sep1 + 4; }
    else {
      const sep2 = part.indexOf('\n\n');
      if (sep2 === -1) continue;
      headerEnd = sep2; bodyStart = sep2 + 2;
    }
    const headerStr = part.slice(0, headerEnd).toString('latin1');
    const body = part.slice(bodyStart);
    const nameM = /name="([^"]*)"/i.exec(headerStr);
    const fileM = /filename="([^"]*)"/i.exec(headerStr);
    const typeM = /content-type:\s*([^\r\n]+)/i.exec(headerStr);
    const name = nameM ? nameM[1] : '';
    if (fileM) {
      const mime = typeM ? typeM[1].trim() : 'application/octet-stream';
      result.push([name, { __file: true, mime, data: body }]);
    } else {
      result.push([name, body.toString('utf8')]);
    }
  }
  return result;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  console.log(`[webhook] 收到请求 id=${id}`);

  try {
    // 1. 查找工作流
    const webhookPath = `/api/trigger-webhook/${id}`;
    const found = await findWorkflowByWebhookUrl(webhookPath);
    if (!found) {
      return NextResponse.json(
        { code: 1, msg: 'webhook not found' },
        { status: 404 },
      );
    }

    const { workflow, triggerNode } = found;
    console.log(`[webhook] 匹配工作流: "${workflow.name}" (${workflow.id})`);

    // 2. 校验 Token
    const secretToken = triggerNode.triggerConfig?.secretToken;
    if (secretToken) {
      const token = request.headers.get('X-Webhook-Token');
      if (token !== secretToken) {
        return NextResponse.json(
          { code: 2, msg: 'invalid token' },
          { status: 403 },
        );
      }
    }

    // 3. 确保用户 Token 可用（自动尝试刷新）
    const authOk = await bitableService.ensureAuth();
    if (!authOk) {
      return NextResponse.json(
        { code: 3, msg: '用户未授权，请先在界面完成飞书登录' },
        { status: 401 },
      );
    }

    // 4. 解析请求体（兼容 JSON / 表单 / multipart）
    let rawBody: Record<string, unknown> = {};
    let webhookContent: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';
    try {
      if (contentType.includes('multipart/form-data')) {
        // 读取原始字节（request.body 只能消费一次，后面需重建请求或手动解析）
        const rawBuf = Buffer.from(await request.arrayBuffer());
        // 用原始字节重建请求再解析（原 request 的 body 已被消费）
        const rebuilt = new Request(request.url, { method: 'POST', headers: request.headers, body: rawBuf });
        // 表单 / 文件上传（如 iOS 快捷指令传图片）：文件转 base64 data URL 注入 content
        let formEntries: [string, unknown][] = [];
        try {
          const form = await rebuilt.formData();
          for (const [k, v] of form.entries()) formEntries.push([k, v]);
        } catch (e) {
          console.warn('[webhook] request.formData() 抛错，将改用手动解析:', e);
        }
        // 兜底：标准解析为空但 body 有内容时，手动按 boundary 拆分（兼容 iOS 非标准 multipart）
        if (formEntries.length === 0 && rawBuf.length > 0) {
          console.log('[webhook] formData() 解析为空，改用手动 multipart 解析');
          formEntries = parseMultipartManual(rawBuf, contentType) as [string, unknown][];
        }
        const textFields: Record<string, unknown> = {};
        const fileFields: Record<string, unknown> = {};
        const unnamedFiles: string[] = []; // iOS 可能以空字段名发送文件，作为兜底
        for (const [k, v] of formEntries) {
          if (typeof v === 'string') {
            if (k) textFields[k] = v;
            console.log(`[webhook] 收到文本字段「${k || '(空)'}」: ${(v as string).slice(0, 40)}`);
          } else {
            let buf: Buffer;
            let mime: string;
            if (v && (v as any).__file) {
              buf = (v as any).data as Buffer;
              mime = (v as any).mime as string;
            } else {
              const f = v as unknown as { arrayBuffer: () => Promise<ArrayBuffer>; type?: string };
              buf = Buffer.from(await f.arrayBuffer());
              mime = f.type || 'application/octet-stream';
            }
            const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
            console.log(`[webhook] 收到文件字段「${k || '(空)'}」: mime=${mime}, ${(buf.length / 1024).toFixed(1)}KB`);
            if (k) fileFields[k] = dataUrl;
            else unnamedFiles.push(dataUrl);
          }
        }
        // 兜底：没有任何命名字段时，把未命名文件当作 image（兼容 iOS 空字段名的情况）
        if (Object.keys(fileFields).length === 0 && unnamedFiles.length > 0) {
          fileFields['image'] = unnamedFiles[0];
          console.log(`[webhook] 未发现命名字段，将 ${unnamedFiles.length} 个未命名文件兜底映射为 image`);
        }
        webhookContent = { ...textFields, ...fileFields };
        rawBody = webhookContent;
        console.log(`[webhook] 解析 multipart 表单：文本字段 ${Object.keys(textFields).join(',') || '无'}，文件字段 ${Object.keys(fileFields).join(',') || '无'}`);
      } else {
        rawBody = await request.json();
        const isObj = !!rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody);
        // 有 content 字段则取 content，否则把整包 body 当作内容（兼容两种传参方式）
        webhookContent = isObj && 'content' in rawBody
          ? ((rawBody.content as Record<string, unknown>) || {})
          : isObj
            ? rawBody
            : {};
      }
    } catch {
      // 请求体为空或非预期格式，使用空 content
    }

    // 4b. 如果 trigger 配置了 webhookBodyTemplate，用它重新解析 JSON
    const bodyTemplate = triggerNode.triggerConfig?.webhookBodyTemplate;
    if (bodyTemplate) {
      try {
        const templateObj = JSON.parse(bodyTemplate);
        const templateContent =
          (templateObj.content as Record<string, unknown>) ?? templateObj;
        const templateKeys = flattenKeys(templateContent);

        if (templateKeys.length > 0) {
          // 从原始 body 中提取匹配的 key 值（在 rawBody 和 rawBody.content 中查找）
          const reParsed: Record<string, unknown> = {};
          for (const key of templateKeys) {
            // 优先从 rawBody 顶层取值，其次从 rawBody.content 取值
            reParsed[key] =
              getNestedValue(rawBody, key) !== undefined
                ? getNestedValue(rawBody, key)
                : getNestedValue(webhookContent, key) !== undefined
                  ? getNestedValue(webhookContent, key)
                  : getNestedValue(templateContent, key); // 最后回退到模板默认值
          }
          webhookContent = reParsed;
          console.log(`[webhook] 根据模板重解析 content，keys: ${templateKeys.join(', ')}`);
        }
      } catch (err) {
        console.warn('[webhook] 模板解析失败，使用原始 content:', err);
      }
    }
    console.log(`[webhook] content:`, safeStringify(webhookContent));

    // 5. 使用 DAG 执行引擎按拓扑序执行节点
    const result = await executeWorkflow(workflow, webhookContent, secretToken);
    console.log(`[webhook] 执行结果:`, result.data?.results);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[webhook] 内部错误:', error);
    return NextResponse.json(
      { code: 99, msg: error.message || 'internal error' },
      { status: 500 },
    );
  }
}
