/**
 * 变量赋值节点插件
 *
 * 借鉴 n8n Set 节点设计：添加、修改或删除变量，供后续节点引用。
 * 可在属性面板中配置多个变量赋值规则。
 */

import { Pencil } from 'lucide-react';
import type { WorkflowNode, AssignConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import AssignNode from '@/app/components/workflow-editor/nodes/AssignNode';

export const assignPlugin: NodePlugin = {
  kind: 'assign',
  rfType: 'assignNode',
  displayName: '变量赋值',
  description: '设置或修改变量，供后续节点使用',
  icon: Pencil,
  color: 'text-indigo-600',
  bg: 'bg-indigo-50',
  border: 'border-indigo-200',
  miniMapColor: '#6366f1',
  category: 'data_transform',

  defaults: () => ({
    variables: [],
  }),

  component: AssignNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.assignConfig as AssignConfig | undefined;
    return {
      label: wfNode.title,
      variables: cfg?.variables || [],
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    assignConfig: {
      variables: data.variables || [],
    },
  }),
};
