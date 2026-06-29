/**
 * Try-Catch 异常处理节点插件
 *
 * 借鉴 n8n Error Trigger + Stop And Error 设计。
 * 主分支执行 try 块，若失败则走 catch 分支（降级/补偿逻辑）。
 */

import { ShieldAlert } from 'lucide-react';
import type { WorkflowNode, TryCatchConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import TryCatchNode from '@/app/components/workflow-editor/nodes/TryCatchNode';

export const tryCatchPlugin: NodePlugin = {
  kind: 'try_catch',
  rfType: 'tryCatchNode',
  displayName: '异常处理',
  description: '捕获执行错误并走降级分支',
  icon: ShieldAlert,
  color: 'text-red-600',
  bg: 'bg-red-50',
  border: 'border-red-200',
  miniMapColor: '#ef4444',
  category: 'flow_control',

  defaults: () => ({
    continueOnError: true,
    errorBranchLabel: '异常处理',
    maxRetries: 0,
    retryDelayMs: 1000,
  }),

  component: TryCatchNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.tryCatchConfig as TryCatchConfig | undefined;
    return {
      label: wfNode.title,
      continueOnError: cfg?.continueOnError ?? true,
      errorBranchLabel: cfg?.errorBranchLabel || '异常处理',
      maxRetries: cfg?.maxRetries ?? 0,
      retryDelayMs: cfg?.retryDelayMs ?? 1000,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    tryCatchConfig: {
      continueOnError: (data.continueOnError as boolean) ?? true,
      errorBranchLabel: (data.errorBranchLabel as string) || '异常处理',
      maxRetries: (data.maxRetries as number) ?? 0,
      retryDelayMs: (data.retryDelayMs as number) ?? 1000,
    },
  }),
};
