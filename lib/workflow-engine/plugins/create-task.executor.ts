/**
 * CreateTask 创建任务执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const createTaskExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.createTaskConfig;
  if (!cfg) {
    return { title: node.title, action: 'create_task', success: false, message: '未配置任务参数' };
  }

  const title = cfg.titleSource === 'webhook'
    ? String(ctx.webhookContent[cfg.title] ?? '无标题')
    : cfg.title;

  const assignee = cfg.assigneeSource === 'webhook'
    ? String(ctx.webhookContent[cfg.assignee] ?? '')
    : cfg.assignee;

  if (!assignee) {
    return { title: node.title, action: 'create_task', success: false, message: '未指定任务负责人' };
  }

  try {
    const { bitableService } = await import('@/services/feishu-bitable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = bitableService as any;
    if (typeof svc.createTask === 'function') {
      const result = await svc.createTask({
        title: title || '无标题', description: cfg.description, assignee,
        dueDate: cfg.dueDate, priority: cfg.priority || 'medium',
      });
      return {
        title: node.title, action: 'create_task', success: true,
        message: `任务已创建: ${title}`,
        output: result as unknown as Record<string, unknown>,
      };
    }
    return {
      title: node.title, action: 'create_task', success: false,
      message: `创建任务功能尚未实现。标题: ${title}, 负责人: ${assignee}`,
      output: { title, assignee, priority: cfg.priority, status: 'not_implemented' },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'create_task', success: false,
      message: `创建失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
