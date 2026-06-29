/**
 * IM 消息节点执行器（服务端专用）
 *
 * 与 im.plugin.ts 分离以避免客户端 bundle 引入 @larksuiteoapi/node-sdk。
 */

import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

async function getBitableService() {
  const { bitableService } = await import('@/services/feishu-bitable');
  return bitableService;
}

function resolveStringValue(
  source: 'manual' | 'webhook',
  manualValue: string,
  webhookKey: string,
  webhookContent: Record<string, unknown>,
): string {
  if (source === 'webhook') {
    const key = webhookKey.startsWith('content.') ? webhookKey.slice('content.'.length) : webhookKey;
    return String(webhookContent[key] ?? '');
  }
  return manualValue;
}

export const imExecutor: NodeExecutor = async (node, ctx) => {
  const bitableService = await getBitableService();
  const cfg = node.imConfig;
  if (!cfg) {
    return { title: node.title, action: 'im_message', success: false, message: '未配置 IM 消息' };
  }

  const receiveId = resolveStringValue(
    cfg.receiveIdSource, cfg.receiveId, cfg.receiveIdWebhookKey, ctx.webhookContent,
  );
  if (!receiveId) {
    return { title: node.title, action: 'im_message', success: false, message: '未指定接收人' };
  }

  const idType = cfg.receiveIdType as 'email' | 'open_id' | 'user_id' | 'union_id' | 'chat_id';

  try {
    if (cfg.msgType === 'text') {
      const text = resolveStringValue(cfg.textSource, cfg.textContent, '', ctx.webhookContent);
      if (!text) {
        return { title: node.title, action: 'im_message', success: false, message: '消息内容为空' };
      }
      const result = await bitableService.sendImTextMessage(idType, receiveId, text);
      return {
        title: node.title, action: 'im_message', success: true,
        message: `文本消息已发送 (${result.messageId})`,
        output: result as unknown as Record<string, unknown>,
      };
    }

    if (cfg.msgType === 'card') {
      const card = resolveStringValue(cfg.cardSource, cfg.cardJson, '', ctx.webhookContent);
      if (!card) {
        return { title: node.title, action: 'im_message', success: false, message: '卡片内容为空' };
      }
      const result = await bitableService.sendImCardMessage(idType, receiveId, card);
      return {
        title: node.title, action: 'im_message', success: true,
        message: `卡片消息已发送 (${result.messageId})`,
        output: result as unknown as Record<string, unknown>,
      };
    }

    return {
      title: node.title, action: 'im_message', success: false,
      message: `不支持的消息类型: ${cfg.msgType}`,
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'im_message', success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
};
