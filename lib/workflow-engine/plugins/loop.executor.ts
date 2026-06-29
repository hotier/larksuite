/**
 * Loop 循环执行器（服务端专用）
 *
 * 注意：当前引擎使用线性 DAG 拓扑排序执行，循环节点的子 DAG 嵌套执行
 * 需要引擎层面支持。此处提供基本循环逻辑：按配置生成迭代数据并透传。
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const loopExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.loopConfig;
  if (!cfg) {
    return { title: node.title, action: 'loop', success: false, message: '未配置循环参数' };
  }

  const maxIterations = Math.min(cfg.maxIterations, 100);
  let iterations = 0;

  try {
    if (cfg.mode === 'fixed_count') {
      iterations = Math.min(cfg.count ?? 1, maxIterations);
    } else if (cfg.mode === 'iterate_array') {
      const source = cfg.iterateSource ? ctx.webhookContent[cfg.iterateSource] : undefined;
      if (Array.isArray(source)) {
        iterations = Math.min(source.length, maxIterations);
      } else {
        return { title: node.title, action: 'loop', success: false, message: '迭代数据不是数组', output: { type: typeof source } };
      }
    } else if (cfg.mode === 'while_condition') {
      iterations = maxIterations; // 安全上限
    }

    return {
      title: node.title,
      action: 'loop',
      success: true,
      message: `循环 ${iterations} 次 (${cfg.mode})`,
      output: { mode: cfg.mode, iterations, maxIterations },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'loop', success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
};
