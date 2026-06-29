/**
 * 延时节点插件
 */

import { Clock } from 'lucide-react';
import type { WorkflowNode, ExecutionStep, DelayConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import DelayNode from '@/app/components/workflow-editor/nodes/DelayNode';

export const delayPlugin: NodePlugin = {
  kind: 'delay',
  rfType: 'delayNode',
  displayName: '延时等待',
  description: '等待指定时间后继续执行',
  icon: Clock,
  color: 'text-orange-600',
  bg: 'bg-orange-50',
  border: 'border-orange-200',
  miniMapColor: '#f97316',
  category: 'flow_control',

  defaults: () => ({
    duration: 1,
    unit: 'minutes' as const,
  }),

  component: DelayNode,

  async execute(node: WorkflowNode): Promise<ExecutionStep> {
    const cfg = node.delayConfig;
    if (!cfg) {
      return { title: node.title, action: 'delay', success: false, message: '未配置延时' };
    }

    const msMap: Record<string, number> = {
      seconds: 1000, minutes: 60_000, hours: 3_600_000, days: 86_400_000,
    };
    const ms = cfg.duration * (msMap[cfg.unit] || 1000);
    const maxDelay = 300_000;
    const actualMs = Math.min(ms, maxDelay);

    await new Promise((resolve) => setTimeout(resolve, actualMs));
    const msg = ms > maxDelay
      ? `延时 ${cfg.duration} ${cfg.unit}（实际最大 ${maxDelay / 1000}s）`
      : `延时 ${cfg.duration} ${cfg.unit}`;
    return { title: node.title, action: 'delay', success: true, message: msg };
  },

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.delayConfig as DelayConfig | undefined;
    return {
      label: wfNode.title,
      duration: cfg?.duration ?? 1,
      unit: cfg?.unit || 'minutes',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    delayConfig: {
      duration: (data.duration as number) ?? 1,
      unit: (data.unit as string) || 'minutes',
    },
  }),
};
