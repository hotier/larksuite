/**
 * 创建文档节点插件
 *
 * 在飞书云空间创建文档/表格/幻灯片/多维表格。
 */

import { FilePlus } from 'lucide-react';
import type { WorkflowNode, CreateDocConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import CreateDocNode from '@/app/components/workflow-editor/nodes/CreateDocNode';

const TYPE_LABELS: Record<string, string> = {
  docx: '文档',
  sheet: '电子表格',
  slide: '幻灯片',
  bitable: '多维表格',
};

export const createDocPlugin: NodePlugin = {
  kind: 'create_doc',
  rfType: 'createDocNode',
  displayName: '创建文档',
  description: '在飞书云空间创建文档/表格/幻灯片/多维表格',
  icon: FilePlus,
  color: 'text-lime-600',
  bg: 'bg-lime-50',
  border: 'border-lime-200',
  miniMapColor: '#65a30d',
  category: 'lark_ecosystem',

  defaults: () => ({
    title: '',
    titleSource: 'manual' as const,
    content: '',
    contentSource: 'manual' as const,
    docType: 'docx' as const,
    folderToken: '',
    shareLink: false,
  }),

  component: CreateDocNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.createDocConfig as CreateDocConfig | undefined;
    return {
      label: wfNode.title,
      title: cfg?.title || '',
      titleSource: cfg?.titleSource || 'manual',
      content: cfg?.content || '',
      contentSource: cfg?.contentSource || 'manual',
      docType: cfg?.docType || 'docx',
      folderToken: cfg?.folderToken || '',
      shareLink: cfg?.shareLink ?? false,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    createDocConfig: {
      title: (data.title as string) || '',
      titleSource: (data.titleSource as string) || 'manual',
      content: (data.content as string) || '',
      contentSource: (data.contentSource as string) || 'manual',
      docType: (data.docType as string) || 'docx',
      folderToken: (data.folderToken as string) || '',
      shareLink: (data.shareLink as boolean) ?? false,
    },
  }),
};
