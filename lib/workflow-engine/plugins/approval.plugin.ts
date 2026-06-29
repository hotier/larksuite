/**
 * 飞书审批节点插件
 *
 * 借鉴 n8n Approval / Wait 节点设计：创建飞书审批实例，并可选等待审批结果。
 * 支持设置审批人、抄送人和表单数据。
 */

import { FileCheck } from 'lucide-react';
import type { WorkflowNode, ApprovalConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import ApprovalNode from '@/app/components/workflow-editor/nodes/ApprovalNode';

export const approvalPlugin: NodePlugin = {
  kind: 'approval',
  rfType: 'approvalNode',
  displayName: '发起审批',
  description: '创建飞书审批实例并等待审批结果',
  icon: FileCheck,
  color: 'text-orange-600',
  bg: 'bg-orange-50',
  border: 'border-orange-200',
  miniMapColor: '#ea580c',
  category: 'lark_ecosystem',

  defaults: () => ({
    approvalCode: '',
    title: '',
    applicant: '',
    formData: '{}',
    formDataSource: 'manual' as const,
    waitForResult: true,
    waitTimeout: 86400000, // 24h
    approvers: '[]',
    ccList: '[]',
  }),

  component: ApprovalNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.approvalConfig as ApprovalConfig | undefined;
    return {
      label: wfNode.title,
      approvalCode: cfg?.approvalCode || '',
      title: cfg?.title || '',
      applicant: cfg?.applicant || '',
      formData: cfg?.formData || '{}',
      formDataSource: cfg?.formDataSource || 'manual',
      waitForResult: cfg?.waitForResult ?? true,
      waitTimeout: cfg?.waitTimeout ?? 86400000,
      approvers: cfg?.approvers || '[]',
      ccList: cfg?.ccList || '[]',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    approvalConfig: {
      approvalCode: (data.approvalCode as string) || '',
      title: (data.title as string) || '',
      applicant: (data.applicant as string) || '',
      formData: (data.formData as string) || '{}',
      formDataSource: (data.formDataSource as string) || 'manual',
      waitForResult: (data.waitForResult as boolean) ?? true,
      waitTimeout: (data.waitTimeout as number) ?? 86400000,
      approvers: (data.approvers as string) || '[]',
      ccList: (data.ccList as string) || '[]',
    },
  }),
};
