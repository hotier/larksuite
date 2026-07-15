/**
 * UploadFile 上传文件执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const uploadFileExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.uploadFileConfig;
  if (!cfg) {
    return { title: node.title, action: 'upload_file', success: false, message: '未配置文件上传' };
  }

  const fileUrl = cfg.fileSource === 'webhook'
    ? String(ctx.webhookContent[cfg.fileUrl] ?? '')
    : cfg.fileUrl;

  if (!fileUrl) {
    return { title: node.title, action: 'upload_file', success: false, message: '未配置文件 URL' };
  }

  try {
    const { feishuService } = await import('@/services/feishu');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = feishuService as any;
    if (typeof svc.uploadFile === 'function') {
      const result = await svc.uploadFile({
        fileUrl, folderToken: cfg.folderToken, fileName: cfg.fileName,
        fileType: cfg.fileType || 'auto',
      });
      return {
        title: node.title, action: 'upload_file', success: true,
        message: `文件已上传: ${cfg.fileName || fileUrl}`,
        output: result as unknown as Record<string, unknown>,
      };
    }
    return {
      title: node.title, action: 'upload_file', success: false,
      message: `上传文件功能尚未实现。URL: ${fileUrl}`,
      output: { fileUrl, fileName: cfg.fileName, status: 'not_implemented' },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'upload_file', success: false,
      message: `上传失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
