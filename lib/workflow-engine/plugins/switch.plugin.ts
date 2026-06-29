/**
 * Switch/Router 多路分支节点插件
 *
 * 借鉴 n8n Switch 节点设计：根据条件将数据路由到不同分支。
 * 双输出 handle：pass (30% 位置, 默认分支) 和 fail (70% 位置, 不匹配分支)。
 * 实际分支由后端根据 switchConfig.branches 匹配。
 */

import { GitBranch } from 'lucide-react';
import type { WorkflowNode, SwitchConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import SwitchNode from '@/app/components/workflow-editor/nodes/SwitchNode';

export const switchPlugin: NodePlugin = {
  kind: 'switch',
  rfType: 'switchNode',
  displayName: '多路分支',
  description: '根据条件将数据路由到不同分支',
  icon: GitBranch,
  color: 'text-sky-600',
  bg: 'bg-sky-50',
  border: 'border-sky-200',
  miniMapColor: '#0ea5e9',
  category: 'flow_control',

  defaults: () => ({
    branches: [],
    hasDefault: true,
  }),

  component: SwitchNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.switchConfig as SwitchConfig | undefined;
    return {
      label: wfNode.title,
      branches: cfg?.branches || [],
      hasDefault: cfg?.hasDefault ?? true,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    switchConfig: {
      branches: data.branches || [],
      hasDefault: (data.hasDefault as boolean) ?? true,
    },
  }),
};
