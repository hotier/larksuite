/**
 * Try-Catch 异常处理执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const tryCatchExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.tryCatchConfig;
  if (!cfg) {
    return { title: node.title, action: 'try_catch', success: false, message: '未配置异常处理' };
  }

  // try-catch 节点本身不执行业务逻辑，而是包裹下游节点
  // 此处记录配置并将其信息传递给后续节点
  return {
    title: node.title,
    action: 'try_catch',
    success: true,
    message: `异常处理已就绪 (重试:${cfg.maxRetries}次, 间隔:${cfg.retryDelayMs}ms)`,
    output: {
      continueOnError: cfg.continueOnError,
      maxRetries: cfg.maxRetries,
      retryDelayMs: cfg.retryDelayMs,
    },
  };
};
