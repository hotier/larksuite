/**
 * 邮件节点插件
 *
 * 借鉴 n8n Send Email 节点设计：发送邮件通知（含执行摘要）。
 */

import { Mail } from 'lucide-react';
import type { WorkflowNode, EmailConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import EmailNode from '@/app/components/workflow-editor/nodes/EmailNode';

export const emailPlugin: NodePlugin = {
  kind: 'email',
  rfType: 'emailNode',
  displayName: '发送邮件',
  description: '发送电子邮件通知',
  icon: Mail,
  color: 'text-rose-600',
  bg: 'bg-rose-50',
  border: 'border-rose-200',
  miniMapColor: '#f43f5e',
  category: 'notification',

  defaults: () => ({
    to: '',
    toSource: 'manual' as const,
    toWebhookKey: '',
    subject: '',
    subjectSource: 'manual' as const,
    body: '',
    bodySource: 'manual' as const,
    bodyFormat: 'text' as const,
    includeSummary: false,
  }),

  component: EmailNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.emailConfig as EmailConfig | undefined;
    return {
      label: wfNode.title,
      to: cfg?.to || '',
      toSource: cfg?.toSource || 'manual',
      toWebhookKey: cfg?.toWebhookKey || '',
      subject: cfg?.subject || '',
      subjectSource: cfg?.subjectSource || 'manual',
      body: cfg?.body || '',
      bodySource: cfg?.bodySource || 'manual',
      bodyFormat: cfg?.bodyFormat || 'text',
      includeSummary: cfg?.includeSummary ?? false,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    emailConfig: {
      to: (data.to as string) || '',
      toSource: (data.toSource as string) || 'manual',
      toWebhookKey: (data.toWebhookKey as string) || '',
      subject: (data.subject as string) || '',
      subjectSource: (data.subjectSource as string) || 'manual',
      body: (data.body as string) || '',
      bodySource: (data.bodySource as string) || 'manual',
      bodyFormat: (data.bodyFormat as string) || 'text',
      includeSummary: (data.includeSummary as boolean) ?? false,
    },
  }),
};
