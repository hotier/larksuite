/**
 * Approval 飞书审批执行器（服务端专用）
 *
 * 支持发起审批实例，可选等待审批结果。
 * 双输出：approved / rejected
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const approvalExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.approvalConfig;
  if (!cfg) {
    return { title: node.title, action: 'approval', success: false, message: '未配置审批参数' };
  }

  if (!cfg.approvalCode) {
    return { title: node.title, action: 'approval', success: false, message: '未指定审批定义码' };
  }

  const applicant = cfg.applicant || String(ctx.webhookContent.applicant ?? '');

  let formData: Record<string, unknown> = {};
  if (cfg.formDataSource === 'webhook') {
    formData = ctx.webhookContent as Record<string, unknown>;
  } else if (cfg.formData) {
    try {
      formData = JSON.parse(cfg.formData);
    } catch {
      return { title: node.title, action: 'approval', success: false, message: '表单数据 JSON 解析失败' };
    }
  }

  try {
    const { feishuService } = await import('@/services/feishu');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = feishuService as any;
    if (typeof svc.createApproval === 'function') {
      const result = await svc.createApproval({
        approvalCode: cfg.approvalCode, title: cfg.title, applicant, formData,
        approvers: cfg.approvers ? JSON.parse(cfg.approvers) as string[] : [],
        ccList: cfg.ccList ? JSON.parse(cfg.ccList) as string[] : [],
      });
      const approvalResult = result as unknown as Record<string, unknown>;
      return {
        title: node.title, action: 'approval', success: true,
        message: `审批已提交: ${cfg.title}${cfg.waitForResult ? ' (等待审批结果)' : ''}`,
        output: { ...approvalResult, waitForResult: cfg.waitForResult },
      };
    }
    return {
      title: node.title, action: 'approval', success: false,
      message: `审批功能尚未实现。Code: ${cfg.approvalCode}, 标题: ${cfg.title}`,
      output: { approvalCode: cfg.approvalCode, title: cfg.title, applicant, status: 'not_implemented' },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'approval', success: false,
      message: `审批提交失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
