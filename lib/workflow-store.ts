/**
 * 工作流持久化存储（Neon PostgreSQL）
 *
 * - UPSERT 替代 DELETE+INSERT：先插入后删除残留，避免"删除-插入"之间数据丢失
 * - JSONB 索引查询：webhook URL 查找直接在数据库层完成，利用 GIN 索引
 */

import { sql } from '@/lib/db';
import type { Workflow, WorkflowNode, WorkflowSummary } from '@/types';

/** 缓存 key 与 TTL（与 app/api/workflows 路由共享） */
export const WF_CACHE_KEY = 'api:workflows';
export const WF_LIST_CACHE_KEY = 'api:workflows:list';
export const WF_TTL = 15_000;          // 节点缓存：写即失效 + 15s 兜底
export const WF_LIST_TTL = 5 * 60_000; // 列表缓存：事件失效 + 5min 兜底

/** 读取所有工作流 */
export async function loadWorkflows(): Promise<Workflow[]> {
  const rows = await sql()`
    SELECT id, name, nodes, status, created_at, updated_at
    FROM workflows
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    nodes: (r.nodes as WorkflowNode[]) || [],
    status: r.status as Workflow['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

/** 读取工作流摘要列表（列表卡片用，不加载 nodes 内容） */
export async function loadWorkflowSummaries(): Promise<WorkflowSummary[]> {
  const rows = await sql()`
    SELECT id, name, status, created_at, updated_at,
           jsonb_array_length(COALESCE(nodes, '[]'::jsonb)) AS node_count
    FROM workflows
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    status: r.status as Workflow['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    nodeCount: Number(r.node_count) || 0,
  }));
}

/**
 * 保存工作流（本地优先的增量同步）
 *
 * 设计原则（区别于「整组覆盖」）：
 * - 只 UPSERT 客户端传来的工作流，绝不主动删除服务端其他记录，
 *   避免「设备 A 保存时把设备 B 刚建的工作流误删」的跨设备互删问题。
 * - 删除由客户端显式通过 `deletedIds` 传递，并对每个被删 id 写入
 *   `workflow_tombstones` 墓碑表，使删除能跨设备传播（其他设备对账时剔除）。
 *
 * 每条 UPSERT 幂等，单条失败不影响已有数据。
 */
export async function saveWorkflows(workflows: Workflow[], deletedIds: string[] = []): Promise<void> {
  const s = sql();

  // Step 1: UPSERT 每条工作流（幂等，不触碰未传来的记录）
  for (const w of workflows) {
    await s`
      INSERT INTO workflows (id, name, nodes, status, created_at, updated_at)
      VALUES (
        ${w.id},
        ${w.name},
        ${JSON.stringify(w.nodes)}::jsonb,
        ${w.status},
        ${w.createdAt},
        ${w.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        name       = EXCLUDED.name,
        nodes      = EXCLUDED.nodes,
        status     = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;
  }

  // Step 2: 仅删除客户端显式标记的 id（来自删除操作），并写入墓碑
  for (const id of deletedIds) {
    await s`DELETE FROM workflows WHERE id = ${id}`;
    await s`
      INSERT INTO workflow_tombstones (id, deleted_at)
      VALUES (${id}, now())
      ON CONFLICT (id) DO UPDATE SET deleted_at = now()
    `;
  }
}

/**
 * 读取墓碑表（被其他设备删除的工作流 id 集合），
 * 供客户端对账时剔除本地残存记录，实现跨设备删除传播。
 */
export async function loadDeletedIds(): Promise<string[]> {
  try {
    const rows = await sql()`SELECT id FROM workflow_tombstones`;
    return rows.map((r) => r.id as string);
  } catch {
    return [];
  }
}

/**
 * 根据 webhook URL 路径查找工作流和触发节点
 *
 * 使用 JSONB @> 包含运算符 + GIN 索引在数据库层直接过滤，
 * 不再全表拉回应用层遍历。
 */
export async function findWorkflowByWebhookUrl(webhookPath: string): Promise<{
  workflow: Workflow;
  triggerNode: WorkflowNode;
} | null> {
  // 构造 JSONB 包含模式：查找 nodes 数组中包含 {type: "trigger", triggerConfig: {webhookUrl: "xxx"}} 的文档
  const pattern = JSON.stringify([
    { type: 'trigger', triggerConfig: { webhookUrl: webhookPath } },
  ]);

  const rows = await sql()`
    SELECT id, name, nodes, status, created_at, updated_at
    FROM workflows
    WHERE nodes @> ${pattern}::jsonb
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const r = rows[0];
  const workflow: Workflow = {
    id: r.id as string,
    name: r.name as string,
    nodes: (r.nodes as WorkflowNode[]) || [],
    status: r.status as Workflow['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };

  // 从匹配的 workflow 中找到具体的 trigger 节点
  for (const node of workflow.nodes) {
    if (node.type === 'trigger' && node.triggerConfig?.webhookUrl === webhookPath) {
      return { workflow, triggerNode: node };
    }
  }

  return null;
}
