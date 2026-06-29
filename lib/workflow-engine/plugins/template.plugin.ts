/**
 * 模板渲染节点插件
 *
 * 借鉴 n8n Edit Fields (Set) + 模板引擎 设计：使用模板语法将变量插入文本。
 * 支持 {{variable}} 等占位符语法，生成渲染后的文本。
 */

import { FileText } from 'lucide-react';
import type { WorkflowNode, TemplateConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import TemplateNode from '@/app/components/workflow-editor/nodes/TemplateNode';

export const templatePlugin: NodePlugin = {
  kind: 'template',
  rfType: 'templateNode',
  displayName: '模板渲染',
  description: '使用模板引擎将变量插入到文本中',
  icon: FileText,
  color: 'text-amber-600',
  bg: 'bg-amber-50',
  border: 'border-amber-200',
  miniMapColor: '#d97706',
  category: 'data_transform',

  defaults: () => ({
    template: '',
    engine: 'handlebars' as const,
    resultVariable: 'rendered',
  }),

  component: TemplateNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.templateConfig as TemplateConfig | undefined;
    return {
      label: wfNode.title,
      template: cfg?.template || '',
      engine: cfg?.engine || 'handlebars',
      resultVariable: cfg?.resultVariable || 'rendered',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    templateConfig: {
      template: (data.template as string) || '',
      engine: (data.engine as string) || 'handlebars',
      resultVariable: (data.resultVariable as string) || 'rendered',
    },
  }),
};
