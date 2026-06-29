/**
 * 结束节点插件
 */

import { CheckCircle } from 'lucide-react';
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { NodePlugin } from '../node-registry';
import EndNode from '@/app/components/workflow-editor/nodes/EndNode';

export const endPlugin: NodePlugin = {
  kind: 'end',
  rfType: 'endNode',
  displayName: '结束',
  description: '工作流终点',
  icon: CheckCircle,
  color: 'text-green-600',
  bg: 'bg-green-50',
  border: 'border-green-200',
  miniMapColor: '#22c55e',
  category: 'core',
  isCore: true,

  defaults: () => ({}),

  component: EndNode,

  async execute(node: WorkflowNode): Promise<ExecutionStep> {
    return {
      title: node.title,
      action: 'end',
      success: true,
      message: '流程结束',
    };
  },
};
