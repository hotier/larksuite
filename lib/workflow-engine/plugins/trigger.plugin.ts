/**
 * 触发器节点插件
 */

import { Webhook } from 'lucide-react';
import type { WorkflowNode, ExecutionStep, TriggerConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import TriggerNode from '@/app/components/workflow-editor/nodes/TriggerNode';

export const triggerPlugin: NodePlugin = {
  kind: 'trigger',
  rfType: 'triggerNode',
  displayName: 'Webhook 触发',
  description: '通过 HTTP POST 请求触发流程',
  icon: Webhook,
  color: 'text-blue-600',
  bg: 'bg-blue-50',
  border: 'border-blue-200',
  miniMapColor: '#3b82f6',
  category: 'trigger',
  isCore: true,

  defaults: () => ({
    triggerKind: 'webhook',
    webhookUrl: '',
    secretToken: '',
    webhookBodyTemplate: '',
  }),

  component: TriggerNode,

  async execute(node: WorkflowNode): Promise<ExecutionStep> {
    return {
      title: node.title,
      action: 'trigger',
      success: true,
      message: '触发完成',
    };
  },

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.triggerConfig as TriggerConfig | undefined;
    return {
      label: wfNode.title,
      triggerKind: cfg?.triggerKind || 'webhook',
      webhookUrl: cfg?.webhookUrl || '',
      secretToken: cfg?.secretToken || '',
      webhookBodyTemplate: cfg?.webhookBodyTemplate || '',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    triggerConfig: {
      triggerKind: (data.triggerKind as string) || 'webhook',
      webhookUrl: (data.webhookUrl as string) || '',
      secretToken: (data.secretToken as string) || '',
      webhookBodyTemplate: (data.webhookBodyTemplate as string) || '',
    },
  }),
};
