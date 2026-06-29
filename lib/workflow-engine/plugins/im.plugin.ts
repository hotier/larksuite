/**
 * IM 消息节点插件
 *
 * execute 逻辑已移至 im.executor.ts（服务端专用），
 * 避免客户端 bundle 引入 @larksuiteoapi/node-sdk。
 */

import { MessageCircle } from 'lucide-react';
import type { WorkflowNode, ImMessageConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import ImNode from '@/app/components/workflow-editor/nodes/ImNode';

export const imPlugin: NodePlugin = {
  kind: 'im_message',
  rfType: 'imNode',
  displayName: '发送消息',
  description: '通过飞书 IM 发送文本或卡片消息',
  icon: MessageCircle,
  color: 'text-violet-600',
  bg: 'bg-violet-50',
  border: 'border-violet-200',
  miniMapColor: '#8b5cf6',
  category: 'action',

  defaults: () => ({
    receiveIdType: 'open_id' as const,
    receiveId: '',
    receiveIdSource: 'manual' as const,
    receiveIdWebhookKey: '',
    msgType: 'text' as const,
    textContent: '',
    textSource: 'manual' as const,
    cardJson: '',
    cardSource: 'manual' as const,
  }),

  component: ImNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.imConfig as ImMessageConfig | undefined;
    return {
      label: wfNode.title,
      receiveIdType: cfg?.receiveIdType || 'open_id',
      receiveId: cfg?.receiveId || '',
      receiveIdSource: cfg?.receiveIdSource || 'manual',
      receiveIdWebhookKey: cfg?.receiveIdWebhookKey || '',
      msgType: cfg?.msgType || 'text',
      textContent: cfg?.textContent || '',
      textSource: cfg?.textSource || 'manual',
      cardJson: cfg?.cardJson || '',
      cardSource: cfg?.cardSource || 'manual',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    imConfig: {
      receiveIdType: (data.receiveIdType as string) || 'open_id',
      receiveId: (data.receiveId as string) || '',
      receiveIdSource: (data.receiveIdSource as string) || 'manual',
      receiveIdWebhookKey: (data.receiveIdWebhookKey as string) || '',
      msgType: (data.msgType as string) || 'text',
      textContent: (data.textContent as string) || '',
      textSource: (data.textSource as string) || 'manual',
      cardJson: (data.cardJson as string) || '',
      cardSource: (data.cardSource as string) || 'manual',
    },
  }),
};
