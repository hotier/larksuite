/**
 * CreateDoc 创建文档执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const createDocExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.createDocConfig;
  if (!cfg) {
    return { title: node.title, action: 'create_doc', success: false, message: '未配置文档参数' };
  }

  const title = cfg.titleSource === 'webhook'
    ? String(ctx.webhookContent[cfg.title] ?? '无标题')
    : cfg.title;

  const content = cfg.contentSource === 'webhook'
    ? String(ctx.webhookContent[cfg.content] ?? '')
    : cfg.content;

  try {
    const { bitableService } = await import('@/services/feishu-bitable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = bitableService as any;
    if (typeof svc.createDoc === 'function') {
      const result = await svc.createDoc({
        title: title || '无标题', content, docType: cfg.docType || 'docx',
        folderToken: cfg.folderToken, shareLink: cfg.shareLink ?? true,
      });
      return {
        title: node.title, action: 'create_doc', success: true,
        message: `文档已创建: ${title}`,
        output: result as unknown as Record<string, unknown>,
      };
    }
    return {
      title: node.title, action: 'create_doc', success: false,
      message: `创建文档功能尚未实现。标题: ${title}, 类型: ${cfg.docType}`,
      output: { title, docType: cfg.docType, status: 'not_implemented' },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'create_doc', success: false,
      message: `创建失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
