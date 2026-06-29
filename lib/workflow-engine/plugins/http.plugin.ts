/**
 * HTTP 请求节点插件
 */

import { Globe } from 'lucide-react';
import type { WorkflowNode, ExecutionStep, HttpRequestConfig } from '@/types';
import type { NodePlugin, ExecutionContext } from '../node-registry';
import HttpNode from '@/app/components/workflow-editor/nodes/HttpNode';

export const httpPlugin: NodePlugin = {
  kind: 'http_request',
  rfType: 'httpNode',
  displayName: 'HTTP 请求',
  description: '向外部系统发送 HTTP 请求',
  icon: Globe,
  color: 'text-teal-600',
  bg: 'bg-teal-50',
  border: 'border-teal-200',
  miniMapColor: '#14b8a6',
  category: 'action',

  defaults: () => ({
    url: '',
    method: 'GET' as const,
    headers: [] as { key: string; value: string }[],
    body: '',
    bodySource: 'manual' as const,
    saveResponse: false,
  }),

  component: HttpNode,

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<ExecutionStep> {
    const cfg = node.httpRequestConfig;
    if (!cfg || !cfg.url) {
      return { title: node.title, action: 'http_request', success: false, message: '未配置请求 URL' };
    }

    const headers: Record<string, string> = {};
    for (const h of cfg.headers) {
      if (h.key) headers[h.key] = h.value;
    }

    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(cfg.method)) {
      body = cfg.bodySource === 'manual' ? cfg.body : JSON.stringify(ctx.webhookContent);
    }

    try {
      const res = await fetch(cfg.url, {
        method: cfg.method,
        headers: { 'Content-Type': 'application/json', ...headers },
        ...(body ? { body } : {}),
      });
      const contentType = res.headers.get('content-type') || '';
      let responseData: unknown;
      if (contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      return {
        title: node.title,
        action: 'http_request',
        success: res.ok,
        message: `${res.status} ${res.statusText}`,
        output: res.ok ? { status: res.status, response: responseData as Record<string, unknown> } : undefined,
      };
    } catch (err: unknown) {
      return {
        title: node.title,
        action: 'http_request',
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  },

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.httpRequestConfig as HttpRequestConfig | undefined;
    return {
      label: wfNode.title,
      url: cfg?.url || '',
      method: cfg?.method || 'GET',
      headers: cfg?.headers || [],
      body: cfg?.body || '',
      bodySource: cfg?.bodySource || 'manual',
      saveResponse: cfg?.saveResponse ?? false,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    httpRequestConfig: {
      url: (data.url as string) || '',
      method: (data.method as string) || 'GET',
      headers: data.headers || [],
      body: (data.body as string) || '',
      bodySource: (data.bodySource as string) || 'manual',
      saveResponse: (data.saveResponse as boolean) ?? false,
    },
  }),
};
