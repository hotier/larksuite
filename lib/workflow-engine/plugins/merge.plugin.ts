/**
 * 合并节点插件
 *
 * 借鉴 n8n Merge 节点设计：将多个上游分支的数据流合并为一条。
 * 支持三种模式：append（追加）、combine（合并到对象）、join（按 key 关联）。
 */

import { Combine } from 'lucide-react';
import type { WorkflowNode, MergeConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import MergeNode from '@/app/components/workflow-editor/nodes/MergeNode';

export const mergePlugin: NodePlugin = {
  kind: 'merge',
  rfType: 'mergeNode',
  displayName: '合并节点',
  description: '合并多个上游分支的数据流',
  icon: Combine,
  color: 'text-teal-600',
  bg: 'bg-teal-50',
  border: 'border-teal-200',
  miniMapColor: '#14b8a6',
  category: 'flow_control',

  defaults: () => ({
    mode: 'append' as const,
    joinKey: '',
    inputCount: 2,
  }),

  component: MergeNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.mergeConfig as MergeConfig | undefined;
    return {
      label: wfNode.title,
      mode: cfg?.mode || 'append',
      joinKey: cfg?.joinKey || '',
      inputCount: cfg?.inputCount ?? 2,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    mergeConfig: {
      mode: (data.mode as string) || 'append',
      joinKey: (data.joinKey as string) || '',
      inputCount: (data.inputCount as number) ?? 2,
    },
  }),
};
