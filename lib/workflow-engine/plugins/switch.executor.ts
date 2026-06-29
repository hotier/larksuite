/**
 * Switch 多路分支执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const switchExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.switchConfig;
  if (!cfg || !cfg.branches || cfg.branches.length === 0) {
    return { title: node.title, action: 'switch', success: false, message: '未配置分支规则' };
  }

  const matched: string[] = [];
  for (const branch of cfg.branches) {
    const fieldValue = branch.valueSource === 'webhook'
      ? String(ctx.webhookContent[branch.fieldName] ?? '')
      : branch.fieldName;

    let match = false;
    const target = branch.valueSource === 'webhook'
      ? String(ctx.webhookContent[branch.value] ?? '')
      : branch.value;
    switch (branch.operator) {
      case 'eq': match = fieldValue === target; break;
      case 'ne': match = fieldValue !== target; break;
      case 'contains': match = String(fieldValue).includes(target); break;
      case 'gt': match = Number(fieldValue) > Number(target); break;
      case 'lt': match = Number(fieldValue) < Number(target); break;
      case 'gte': match = Number(fieldValue) >= Number(target); break;
      case 'lte': match = Number(fieldValue) <= Number(target); break;
    }
    if (match) matched.push(branch.label || branch.id);
  }

  if (matched.length === 0 && cfg.hasDefault) {
    matched.push('default');
  }

  return {
    title: node.title,
    action: 'switch',
    success: true,
    message: matched.length > 0 ? `匹配分支: ${matched.join(', ')}` : '无匹配分支',
    output: { matchedBranches: matched, branchCount: cfg.branches.length },
  };
};
