/**
 * Merge 合并执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const mergeExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.mergeConfig;
  if (!cfg) {
    return { title: node.title, action: 'merge', success: false, message: '未配置合并参数' };
  }

  // 收集所有上游节点的输出
  const allOutputs: Record<string, unknown>[] = [];
  for (const [, output] of ctx.nodeOutputs) {
    allOutputs.push(output);
  }

  let merged: Record<string, unknown> = {};

  if (cfg.mode === 'append') {
    merged = { items: allOutputs, count: allOutputs.length };
  } else if (cfg.mode === 'combine') {
    // 浅合并所有输出
    merged = Object.assign({}, ...allOutputs);
  } else if (cfg.mode === 'join') {
    // 按 key 关联
    merged = { joined: allOutputs, key: cfg.joinKey ?? '_id' };
  }

  return {
    title: node.title,
    action: 'merge',
    success: true,
    message: `合并 ${allOutputs.length} 个输入 (${cfg.mode})`,
    output: merged,
  };
};
