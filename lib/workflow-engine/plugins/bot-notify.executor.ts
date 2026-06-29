/**
 * Bot Notify 机器人通知执行器（服务端专用）
 *
 * 支持飞书、钉钉、企业微信、Slack 等多通道 Webhook Bot 通知。
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

function resolveContent(
  source: 'manual' | 'webhook' | 'template',
  manualValue: string,
  ctx: ExecutionContext,
): string {
  if (source === 'webhook') {
    return JSON.stringify(ctx.webhookContent);
  }
  return manualValue;
}

export const botNotifyExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.botNotifyConfig;
  if (!cfg) {
    return { title: node.title, action: 'bot_notify', success: false, message: '未配置 Bot 通知' };
  }

  if (!cfg.webhookUrl) {
    return { title: node.title, action: 'bot_notify', success: false, message: '未配置 Webhook URL' };
  }

  const content = resolveContent(cfg.contentSource, cfg.content, ctx);
  const title = cfg.title || `工作流通知 (${node.title})`;

  try {
    // 构建不同渠道的消息格式
    let body: Record<string, unknown>;
    switch (cfg.channel) {
      case 'feishu':
        body = {
          msg_type: 'interactive',
          card: {
            header: { title: { tag: 'plain_text', content: title } },
            elements: [{ tag: 'markdown', content }],
          },
        };
        break;
      case 'dingtalk':
        body = {
          msgtype: 'markdown',
          markdown: { title, text: `# ${title}\n${content}` },
        };
        break;
      case 'wechat_work':
        body = {
          msgtype: 'markdown',
          markdown: { content: `# ${title}\n${content}` },
        };
        break;
      case 'slack':
        body = { text: `*${title}*\n${content}` };
        break;
      default:
        body = { title, content };
    }

    const response = await fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        title: node.title, action: 'bot_notify', success: false,
        message: `Webhook 返回 ${response.status}: ${errText}`,
      };
    }

    return {
      title: node.title,
      action: 'bot_notify',
      success: true,
      message: `通知已发送到 ${cfg.channel}`,
      output: { channel: cfg.channel, status: response.status },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'bot_notify', success: false,
      message: `发送失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};
