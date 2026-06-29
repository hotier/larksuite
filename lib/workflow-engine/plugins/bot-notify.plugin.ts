/**
 * Bot 通知节点插件
 *
 * 借鉴 n8n Webhook + Send Notification 设计：通过 Bot Webhook 推送通知到飞书/钉钉/企微等。
 * 支持 Markdown 内容和多级别提醒。
 */

import { Bell } from 'lucide-react';
import type { WorkflowNode, BotNotifyConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import BotNotifyNode from '@/app/components/workflow-editor/nodes/BotNotifyNode';

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
  success: 'text-emerald-600',
};

export const botNotifyPlugin: NodePlugin = {
  kind: 'bot_notify',
  rfType: 'botNotifyNode',
  displayName: 'Bot 通知',
  description: '通过 Bot Webhook 推送通知到飞书/钉钉/企微等',
  icon: Bell,
  color: 'text-fuchsia-600',
  bg: 'bg-fuchsia-50',
  border: 'border-fuchsia-200',
  miniMapColor: '#d946ef',
  category: 'notification',

  defaults: () => ({
    channel: 'feishu' as const,
    webhookUrl: '',
    title: '',
    content: '',
    contentSource: 'manual' as const,
    level: 'info' as const,
  }),

  component: BotNotifyNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.botNotifyConfig as BotNotifyConfig | undefined;
    return {
      label: wfNode.title,
      channel: cfg?.channel || 'feishu',
      webhookUrl: cfg?.webhookUrl || '',
      title: cfg?.title || '',
      content: cfg?.content || '',
      contentSource: cfg?.contentSource || 'manual',
      level: cfg?.level || 'info',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    botNotifyConfig: {
      channel: (data.channel as string) || 'feishu',
      webhookUrl: (data.webhookUrl as string) || '',
      title: (data.title as string) || '',
      content: (data.content as string) || '',
      contentSource: (data.contentSource as string) || 'manual',
      level: (data.level as string) || 'info',
    },
  }),
};
