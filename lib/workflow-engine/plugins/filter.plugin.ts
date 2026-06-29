/**
 * 筛选节点插件
 */

import { Filter } from 'lucide-react';
import type { WorkflowNode, ExecutionStep, FilterConfig } from '@/types';
import type { NodePlugin, ExecutionContext } from '../node-registry';
import FilterNode from '@/app/components/workflow-editor/nodes/FilterNode';

export const filterPlugin: NodePlugin = {
  kind: 'filter',
  rfType: 'filterNode',
  displayName: '条件筛选',
  description: '按条件过滤，决定是否继续执行',
  icon: Filter,
  color: 'text-slate-600',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  miniMapColor: '#64748b',
  category: 'flow_control',

  defaults: () => ({
    conditions: [],
    matchMode: 'all' as const,
  }),

  component: FilterNode,

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<ExecutionStep> {
    const cfg = node.filterConfig;
    if (!cfg || cfg.conditions.length === 0) {
      return { title: node.title, action: 'filter', success: false, message: '未配置筛选条件' };
    }

    const content = ctx.webhookContent;
    const results = cfg.conditions.map((c) => {
      const fieldValue = String(content[c.fieldName] ?? '');
      switch (c.operator) {
        case 'eq': return fieldValue === c.value;
        case 'ne': return fieldValue !== c.value;
        case 'contains': return fieldValue.includes(c.value);
        case 'gt': return Number(fieldValue) > Number(c.value);
        case 'lt': return Number(fieldValue) < Number(c.value);
        case 'gte': return Number(fieldValue) >= Number(c.value);
        case 'lte': return Number(fieldValue) <= Number(c.value);
        default: return false;
      }
    });

    const passed = cfg.matchMode === 'all' ? results.every(Boolean) : results.some(Boolean);
    return {
      title: node.title,
      action: 'filter',
      success: passed,
      message: passed ? '条件通过' : '条件不通过 — 流程终止',
    };
  },

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.filterConfig as FilterConfig | undefined;
    return {
      label: wfNode.title,
      conditions: cfg?.conditions || [],
      matchMode: cfg?.matchMode || 'all',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    filterConfig: {
      conditions: data.conditions || [],
      matchMode: data.matchMode || 'all',
    },
  }),
};
