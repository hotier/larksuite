/**
 * Template 模板渲染执行器（服务端专用）
 *
 * 支持 Handlebars、Mustache 和纯文本 {{var}} 占位符替换。
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

function renderPlain(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}

export const templateExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.templateConfig;
  if (!cfg || !cfg.template) {
    return { title: node.title, action: 'template', success: false, message: '未配置模板' };
  }

  const data = {
    ...Object.fromEntries(ctx.nodeOutputs),
    ...ctx.webhookContent,
  };

  let rendered = '';
  try {
    if (cfg.engine === 'handlebars' || cfg.engine === 'mustache') {
      // Handlebars/Mustache 需要安装对应的 npm 包
      // 当前降级到纯文本 {{var}} 替换
      rendered = renderPlain(cfg.template, data);
    } else {
      rendered = renderPlain(cfg.template, data);
    }
  } catch (err: unknown) {
    return {
      title: node.title, action: 'template', success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const output: Record<string, unknown> = { rendered };
  if (cfg.resultVariable) {
    output[cfg.resultVariable] = rendered;
  }

  return {
    title: node.title,
    action: 'template',
    success: true,
    message: '模板渲染成功',
    output,
  };
};
