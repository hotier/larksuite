/**
 * Email 邮件执行器（服务端专用）
 *
 * 通过飞书邮件 API 发送邮件。
 * 当服务端方法未实现时返回友好的错误信息。
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

function resolveValue(
  source: 'manual' | 'webhook',
  manualValue: string,
  webhookKey: string,
  ctx: ExecutionContext,
): string {
  if (source === 'webhook') {
    const key = webhookKey.startsWith('content.') ? webhookKey.slice('content.'.length) : webhookKey;
    return String(ctx.webhookContent[key] ?? '');
  }
  return manualValue;
}

export const emailExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.emailConfig;
  if (!cfg) {
    return { title: node.title, action: 'email', success: false, message: '未配置邮件' };
  }

  const to = resolveValue(cfg.toSource, cfg.to, cfg.toWebhookKey, ctx);
  const subject = resolveValue(cfg.subjectSource, cfg.subject, '', ctx);
  const body = resolveValue(cfg.bodySource, cfg.body, '', ctx);

  if (!to) {
    return { title: node.title, action: 'email', success: false, message: '未指定收件人' };
  }

  try {
    const { bitableService } = await import('@/services/feishu-bitable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = bitableService as any;
    if (typeof svc.sendEmail === 'function') {
      const result = await svc.sendEmail({
        to, subject: subject || '工作流通知', body: body || '',
        bodyFormat: cfg.bodyFormat || 'text',
        includeSummary: cfg.includeSummary ?? false,
      });
      return {
        title: node.title, action: 'email', success: true,
        message: `邮件已发送到 ${to}`,
        output: result as unknown as Record<string, unknown>,
      };
    }
    return {
      title: node.title, action: 'email', success: false,
      message: `邮件发送功能尚未实现。目标收件人: ${to}, 主题: ${subject}`,
      output: { to, subject, bodyPreview: body.slice(0, 200) },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'email', success: false,
      message: `发送失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
