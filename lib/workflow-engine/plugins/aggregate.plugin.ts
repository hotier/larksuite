/**
 * 数据聚合节点插件
 *
 * 借鉴 n8n Aggregate 节点设计：对数据列表进行统计运算。
 * 操作：计数、求和、平均、最小、最大、分组。
 */

import { BarChart3 } from 'lucide-react';
import type { WorkflowNode, AggregateConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import AggregateNode from '@/app/components/workflow-editor/nodes/AggregateNode';

export const aggregatePlugin: NodePlugin = {
  kind: 'aggregate',
  rfType: 'aggregateNode',
  displayName: '数据聚合',
  description: '对数据列表进行聚合统计（计数、求和、分组等）',
  icon: BarChart3,
  color: 'text-cyan-600',
  bg: 'bg-cyan-50',
  border: 'border-cyan-200',
  miniMapColor: '#06b6d4',
  category: 'data_transform',

  defaults: () => ({
    operation: 'count' as const,
    fieldName: '',
    groupByField: '',
    dataSource: 'webhook' as const,
    resultVariable: 'result',
  }),

  component: AggregateNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.aggregateConfig as AggregateConfig | undefined;
    return {
      label: wfNode.title,
      operation: cfg?.operation || 'count',
      fieldName: cfg?.fieldName || '',
      groupByField: cfg?.groupByField || '',
      dataSource: cfg?.dataSource || 'webhook',
      resultVariable: cfg?.resultVariable || 'result',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    aggregateConfig: {
      operation: (data.operation as string) || 'count',
      fieldName: (data.fieldName as string) || '',
      groupByField: (data.groupByField as string) || '',
      dataSource: (data.dataSource as string) || 'webhook',
      resultVariable: (data.resultVariable as string) || 'result',
    },
  }),
};
