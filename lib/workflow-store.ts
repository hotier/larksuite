/**
 * 服务端工作流持久化存储（JSON 文件）
 *
 * 前端每次编辑工作流后通过 POST /api/workflows 同步到服务端，
 * webhook 接收端从此读取工作流配置以执行自动化。
 */

import fs from 'fs';
import path from 'path';
import type { Workflow } from '@/types';

const STORE_PATH = path.join(process.cwd(), 'data', 'workflows.json');

/** 确保存储目录和文件存在 */
function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, '[]', 'utf-8');
  }
}

/** 读取所有工作流 */
export function loadWorkflows(): Workflow[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as Workflow[];
  } catch {
    return [];
  }
}

/** 保存所有工作流 */
export function saveWorkflows(workflows: Workflow[]): void {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(workflows, null, 2), 'utf-8');
}

/** 根据 webhook URL 路径查找工作流和触发节点 */
export function findWorkflowByWebhookUrl(webhookPath: string): {
  workflow: Workflow;
  triggerNode: import('@/types').WorkflowNode;
} | null {
  const workflows = loadWorkflows();
  for (const w of workflows) {
    for (const node of w.nodes) {
      if (node.type === 'trigger' && node.triggerConfig?.webhookUrl === webhookPath) {
        return { workflow: w, triggerNode: node };
      }
    }
  }
  return null;
}
