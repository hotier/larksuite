import { NextResponse } from 'next/server';
import { bitableService } from '@/services/feishu-bitable';
import { exchangeCode } from '@/lib/auth-code-store';

/**
 * POST /api/bitable — 统一的飞书 API 代理入口
 * 所有前端请求通过此路由转发到飞书开放平台
 */
export async function POST(request: Request) {
  // 声明在 try 外层，确保 catch 块中可访问（用于错误日志）
  let action = '';
  let appToken = '';
  let tableId = '';
  try {
    const body = await request.json();
    ({
      action,
      appToken,
      tableId,
    } = body);
    const {
      recordId,
      fields,
      pageSize,
      pageToken,
      tableName,
      folderToken,
      appName,
      useUserToken,
      userToken,
      tokenExpire,
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: '缺少必要参数: action' },
        { status: 400 }
      );
    }

    // 提取用户 token（显式传递，避免 singlen 竞态）
    const uaToken: string | null = (useUserToken && userToken) ? userToken : null;
    // 同时回填到实例，供 webhook 等无法显式传 token 的场景
    if (uaToken) {
      const expireVal = tokenExpire ? parseInt(tokenExpire) : 7200;
      const expireTime = expireVal > 10_000_000_000 ? expireVal : Date.now() + expireVal * 1000;
      bitableService.setUserAccessToken(uaToken, expireTime);
    }

    let result;

    switch (action) {
      case 'getOAuthUrl':
        result = { url: bitableService.getOAuthUrl() };
        break;

      case 'exchangeAuthCode': {
        // 从 HttpOnly Cookie 中读取一次性授权码（不经过 URL，更安全）
        const authCode = request.cookies.get('auth_code')?.value;
        if (!authCode) {
          return NextResponse.json(
            { success: false, error: '未找到授权码' },
            { status: 403 }
          );
        }
        const entry = exchangeCode(authCode);
        if (!entry) {
          return NextResponse.json(
            { success: false, error: '授权码无效或已过期' },
            { status: 403 }
          );
        }
        // 交换成功后立刻清除 cookie
        const response = NextResponse.json({
          success: true,
          data: {
            accessToken: entry.accessToken,
            refreshToken: entry.refreshToken,
            expire: entry.expire,
          },
        });
        response.cookies.delete('auth_code');
        return response;
      }

      case 'listApps':
        result = await bitableService.listApps(pageSize, pageToken, folderToken, uaToken);
        break;

      case 'createApp':
        if (!appName) throw new Error('缺少参数: appName');
        result = await bitableService.createApp(appName, folderToken, uaToken);
        break;

      case 'listDocs':
        result = await bitableService.listDocs(pageSize, pageToken, folderToken, uaToken);
        break;

      case 'createDoc':
        if (!appName) throw new Error('缺少参数: appName');
        result = await bitableService.createDocx(appName, folderToken, uaToken);
        break;

      case 'listSheets':
        result = await bitableService.listSheets(pageSize, pageToken, folderToken, uaToken);
        break;

      case 'createSheet':
        if (!appName) throw new Error('缺少参数: appName');
        result = await bitableService.createSheet(appName, folderToken, uaToken);
        break;

      case 'deleteFile': {
        const { fileToken, fileType: fType } = body;
        if (!fileToken || !fType) throw new Error('缺少参数: fileToken, fileType');
        await bitableService.deleteFile(fileToken, fType, uaToken);
        result = { ok: true };
        break;
      }

      case 'listTables':
        if (!appToken) throw new Error('缺少参数: appToken');
        result = await bitableService.listTables(appToken, pageSize, pageToken, uaToken);
        break;

      case 'createTable':
        if (!appToken || !tableName || !fields) throw new Error('缺少参数: appToken, tableName, fields');
        result = await bitableService.createTable(appToken, tableName, fields, uaToken);
        break;

      case 'deleteTable':
        if (!appToken || !tableId) throw new Error('缺少参数: appToken, tableId');
        result = await bitableService.deleteTable(appToken, tableId, uaToken);
        break;

      case 'listFields':
        if (!appToken || !tableId) throw new Error('缺少参数: appToken, tableId');
        result = await bitableService.listFields(appToken, tableId, pageSize, pageToken, uaToken);
        break;

      case 'list':
        if (!appToken || !tableId) throw new Error('缺少参数: appToken, tableId');
        result = await bitableService.listRecords(appToken, tableId, pageSize, pageToken, uaToken);
        break;

      case 'read':
        if (!appToken || !tableId || !recordId) throw new Error('缺少参数: appToken, tableId, recordId');
        result = await bitableService.readRecord(appToken, tableId, recordId, uaToken);
        break;

      case 'create':
        if (!appToken || !tableId || !fields) throw new Error('缺少参数: appToken, tableId, fields');
        console.log(`[create] appToken=${appToken} tableId=${tableId} fields (by name)=`, JSON.stringify(fields));
        result = await bitableService.createRecord(appToken, tableId, fields, uaToken);
        break;

      case 'update':
        if (!appToken || !tableId || !recordId || !fields)
          throw new Error('缺少参数: appToken, tableId, recordId, fields');
        result = await bitableService.updateRecord(appToken, tableId, recordId, fields, uaToken);
        break;

      case 'delete':
        if (!appToken || !tableId || !recordId) throw new Error('缺少参数: appToken, tableId, recordId');
        result = await bitableService.deleteRecord(appToken, tableId, recordId, uaToken);
        break;

      default:
        return NextResponse.json(
          { error: `不支持的操作类型: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : '未知错误';
    // 提取飞书 API 原始错误信息（优先从 error 对象上的自定义属性，其次从 axios response）
    const feishuCode: number | undefined = error?.feishuCode ?? error?.response?.data?.code;
    const feishuMsg: string | undefined = error?.feishuMsg ?? error?.response?.data?.msg;
    console.error(
      `[API /api/bitable] action=${action} | appToken=${appToken} | tableId=${tableId}`,
      feishuCode !== undefined ? `| feishuCode=${feishuCode} feishuMsg=${feishuMsg}` : '',
      '\n  Error:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        success: false,
        error: message,
        feishuCode,
        feishuMsg,
      },
      { status: 500 }
    );
  }
}
