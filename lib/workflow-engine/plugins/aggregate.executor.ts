/**
 * Aggregate 数据聚合执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const aggregateExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.aggregateConfig;
  if (!cfg) {
    return { title: node.title, action: 'aggregate', success: false, message: '未配置聚合参数' };
  }

  // 从上下文获取数据
  const data = cfg.dataSource === 'webhook'
    ? ctx.webhookContent
    : Object.fromEntries(ctx.nodeOutputs);

  const items = Array.isArray(data) ? data
    : Array.isArray(data[cfg.fieldName]) ? data[cfg.fieldName] as unknown[]
    : [data];

  if (!Array.isArray(items) || items.length === 0) {
    return { title: node.title, action: 'aggregate', success: true, message: '无数据可聚合', output: { result: 0 } };
  }

  let result: unknown;
  const numericItems = items
    .map((item) => {
      const val = typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>)[cfg.fieldName]
        : item;
      return Number(val);
    })
    .filter((n) => !isNaN(n));

  switch (cfg.operation) {
    case 'count':
      result = items.length;
      break;
    case 'sum':
      result = numericItems.reduce((a, b) => a + b, 0);
      break;
    case 'avg':
      result = numericItems.length > 0 ? numericItems.reduce((a, b) => a + b, 0) / numericItems.length : 0;
      break;
    case 'min':
      result = numericItems.length > 0 ? Math.min(...numericItems) : 0;
      break;
    case 'max':
      result = numericItems.length > 0 ? Math.max(...numericItems) : 0;
      break;
    case 'group_by': {
      const groups: Record<string, unknown[]> = {};
      for (const item of items) {
        const obj = item as Record<string, unknown> ?? {};
        const key = String(obj[cfg.groupByField ?? '_group'] ?? '__default__');
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      result = groups;
      break;
    }
    default:
      result = null;
  }

  const output: Record<string, unknown> = { result };
  output[cfg.resultVariable || 'aggregate_result'] = result;

  return {
    title: node.title,
    action: 'aggregate',
    success: true,
    message: `${cfg.operation}: ${JSON.stringify(result)}`,
    output,
  };
};
