import { bitableService } from '@/services/feishu-bitable';

interface FileParams {
  fileToken: string;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  fileName: string;
}

/**
 * 代理飞书文件内容，返回浏览器可预览的 Response
 */
export async function proxyFeishuFile(params: FileParams) {
  const { fileToken, tableId, fieldId, recordId, fileName } = params;

  const tmpUrl = await bitableService.getTmpDownloadUrl(
    fileToken,
    tableId,
    fieldId,
    recordId,
  );

  if (!tmpUrl) {
    return Response.json(
      { error: '获取下载链接失败，请确认已授权登录' },
      { status: 500 }
    );
  }

  const fileRes = await fetch(tmpUrl);
  if (!fileRes.ok) {
    return Response.json(
      { error: `代理文件失败: ${fileRes.status}` },
      { status: 502 }
    );
  }

  const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
  const contentLength = fileRes.headers.get('content-length');
  const buffer = await fileRes.arrayBuffer();

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    'Cache-Control': 'public, max-age=86400',
  };
  if (contentLength) {
    headers['Content-Length'] = contentLength;
  }

  return new Response(buffer, { status: 200, headers });
}
