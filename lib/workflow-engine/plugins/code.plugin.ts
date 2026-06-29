/**
 * 代码脚本节点插件
 *
 * 借鉴 n8n Code 节点设计：运行自定义 JavaScript/Python 代码片段。
 * eslint-disable-next-line no-template-curly-in-string
 */

import { Code2 } from 'lucide-react';
import type { WorkflowNode, CodeConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import CodeNode from '@/app/components/workflow-editor/nodes/CodeNode';

export const codePlugin: NodePlugin = {
  kind: 'code',
  rfType: 'codeNode',
  displayName: '代码脚本',
  description: '运行 JavaScript/Python 自定义代码片段',
  icon: Code2,
  color: 'text-gray-600',
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  miniMapColor: '#6b7280',
  category: 'data_transform',

  defaults: () => ({
    language: 'javascript' as const,
    code: `// 输入: $input (webhook 数据)\n// 输出: return 的数据会传递到下一节点\nconst data = $input;\nreturn { processed: true, data };`,
    timeout: 10000,
  }),

  component: CodeNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.codeConfig as CodeConfig | undefined;
    return {
      label: wfNode.title,
      language: cfg?.language || 'javascript',
      code: cfg?.code || '',
      timeout: cfg?.timeout ?? 10000,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    codeConfig: {
      language: (data.language as string) || 'javascript',
      code: (data.code as string) || '',
      timeout: (data.timeout as number) ?? 10000,
    },
  }),
};
