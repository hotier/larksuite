/**
 * Assign 变量赋值执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const assignExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.assignConfig;
  if (!cfg || !cfg.variables || cfg.variables.length === 0) {
    return { title: node.title, action: 'assign', success: false, message: '未配置变量赋值' };
  }

  const vars: Record<string, unknown> = {};
  for (const v of cfg.variables) {
    let value: unknown = '';
    if (v.source === 'manual') {
      value = v.value;
    } else if (v.source === 'webhook' && v.webhookKey) {
      const key = v.webhookKey.startsWith('content.') ? v.webhookKey.slice('content.'.length) : v.webhookKey;
      value = ctx.webhookContent[key] ?? '';
    } else if (v.source === 'expression' && v.expression) {
      // 简单的 JavaScript 表达式求值
      try {
        const nodeData = Object.create(null) as Record<string, unknown>;
        for (const [k, v] of ctx.nodeOutputs) { nodeData[k] = v; }
        const fn = new Function('data', 'ctx', `return (${v.expression})`);
        value = fn({ ...nodeData, ...ctx.webhookContent }, ctx);
      } catch {
        value = `[表达式错误: ${v.expression}]`;
      }
    }
    vars[v.name] = value;
  }

  return {
    title: node.title,
    action: 'assign',
    success: true,
    message: `已设置 ${Object.keys(vars).length} 个变量`,
    output: vars,
  };
};
