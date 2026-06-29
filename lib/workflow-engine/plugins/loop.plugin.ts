/**
 * 循环迭代节点插件
 *
 * 借鉴 n8n Loop Over Items / Split In Batches 设计。
 * 支持三种模式：fixed_count（固定次数）、iterate_array（迭代数组）、while_condition（条件循环）。
 */

import { Repeat } from 'lucide-react';
import type { WorkflowNode, LoopConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import LoopNode from '@/app/components/workflow-editor/nodes/LoopNode';

export const loopPlugin: NodePlugin = {
  kind: 'loop',
  rfType: 'loopNode',
  displayName: '循环迭代',
  description: '对数组或指定次数循环执行内部步骤',
  icon: Repeat,
  color: 'text-pink-600',
  bg: 'bg-pink-50',
  border: 'border-pink-200',
  miniMapColor: '#ec4899',
  category: 'flow_control',

  defaults: () => ({
    mode: 'fixed_count' as const,
    count: 1,
    iterateSource: '',
    whileCondition: null,
    maxIterations: 100,
    concurrency: 1,
  }),

  component: LoopNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.loopConfig as LoopConfig | undefined;
    return {
      label: wfNode.title,
      mode: cfg?.mode || 'fixed_count',
      count: cfg?.count ?? 1,
      iterateSource: cfg?.iterateSource || '',
      whileCondition: cfg?.whileCondition || null,
      maxIterations: cfg?.maxIterations ?? 100,
      concurrency: cfg?.concurrency ?? 1,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    loopConfig: {
      mode: (data.mode as string) || 'fixed_count',
      count: (data.count as number) ?? 1,
      iterateSource: (data.iterateSource as string) || '',
      whileCondition: data.whileCondition || null,
      maxIterations: (data.maxIterations as number) ?? 100,
      concurrency: (data.concurrency as number) ?? 1,
    },
  }),
};
