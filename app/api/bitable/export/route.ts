import { NextRequest, NextResponse } from 'next/server';
import { bitableService } from '@/services/feishu-bitable';
import { logger } from '@/lib/logger';

// 导出涉及文件流，必须使用 Node.js 运行时
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cookie 名称常量（与 api/bitable/route.ts 保持一致） */
const TOKEN_COOKIE = 'feishu_token';
const EXPIRE_COOKIE = 'feishu_token_expire';

const CONTENT_TYPES: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv; charset=utf-8',
};

/**
 * POST /api/bitable/export
 * body: { appToken: string, format?: 'xlsx' | 'csv', tableId?: string }
 * 导出多维表格（或全部数据表）为 Excel/CSV 并触发下载
 */
export async function POST(request: NextRequest) {
  try {
    // 会话有效性（与统一路由保持一致：仅用 Cookie 判断登录态）
    const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value || null;
    const expireStr = request.cookies.get(EXPIRE_COOKIE)?.value || '0';
    const sessionValid = cookieToken !== null && Date.now() < (parseInt(expireStr) || 0);
    if (!sessionValid) {
      return NextResponse.json(
        { error: '未登录或会话已过期', needLogin: true },
        { status: 401 },
      );
    }

    // drive 导出必须以用户身份执行：先确保服务端托管并自动刷新了 user_access_token
    const authed = await bitableService.ensureAuth();
    if (!authed) {
      return NextResponse.json(
        { error: '登录已失效，请重新授权', needLogin: true },
        { status: 401 },
      );
    }

    const body = await request.json();
    const appToken = body.appToken as string | undefined;
    const format = body.format === 'csv' ? 'csv' : 'xlsx';
    const tableId = (body.tableId as string | undefined) || undefined;
    const appName = (body.appName as string | undefined) || undefined;

    if (!appToken) {
      return NextResponse.json({ error: '缺少参数: appToken' }, { status: 400 });
    }

    // 读取记录拼装导出（内部用应用身份），tableId 为空时导出全部数据表。
    const { buffer, fileName } = await bitableService.exportBitable(appToken, format, undefined, tableId, appName);

    // 仅过滤 Windows 非法字符与控制字符，并去掉空白；保留【】、emoji 等合法字符
    // （fileName 已由 services 端 sanitize 过，这里只做兜底，不再把【】/👤等洗成下划线）
    const safeName = (fileName || `bitable_export.${format}`)
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/\s+/g, '');
    const encoded = encodeURIComponent(safeName);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': CONTENT_TYPES[format],
        'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('[ExportBitable] 导出异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导出失败' },
      { status: 500 },
    );
  }
}
