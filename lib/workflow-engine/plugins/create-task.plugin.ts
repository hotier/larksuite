/**
 * 创建任务节点插件
 *
 * 创建飞书待办任务并指派负责人，支持优先级和截止时间。
 */

import { CheckSquare } from 'lucide-react';
import type { WorkflowNode, CreateTaskConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import CreateTaskNode from '@/app/components/workflow-editor/nodes/CreateTaskNode';

export const createTaskPlugin: NodePlugin = {
  kind: 'create_task',
  rfType: 'createTaskNode',
  displayName: '创建任务',
  description: '创建飞书待办任务并指派负责人',
  icon: CheckSquare,
  color: 'text-yellow-600',
  bg: 'bg-yellow-50',
  border: 'border-yellow-200',
  miniMapColor: '#ca8a04',
  category: 'lark_ecosystem',

  defaults: () => ({
    title: '',
    titleSource: 'manual' as const,
    description: '',
    assignee: '',
    assigneeSource: 'manual' as const,
    dueDate: '',
    priority: 'medium' as const,
  }),

  component: CreateTaskNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.createTaskConfig as CreateTaskConfig | undefined;
    return {
      label: wfNode.title,
      title: cfg?.title || '',
      titleSource: cfg?.titleSource || 'manual',
      description: cfg?.description || '',
      assignee: cfg?.assignee || '',
      assigneeSource: cfg?.assigneeSource || 'manual',
      dueDate: cfg?.dueDate || '',
      priority: cfg?.priority || 'medium',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    createTaskConfig: {
      title: (data.title as string) || '',
      titleSource: (data.titleSource as string) || 'manual',
      description: (data.description as string) || '',
      assignee: (data.assignee as string) || '',
      assigneeSource: (data.assigneeSource as string) || 'manual',
      dueDate: (data.dueDate as string) || '',
      priority: (data.priority as string) || 'medium',
    },
  }),
};
