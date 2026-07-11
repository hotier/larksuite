/**
 * 工作流「本地优先（local-first）」同步工具
 *
 * 与 bitable 数据（服务端拥有、客户端缓存）不同，工作流是
 * 「客户端拥有数据、服务端做副本同步」。因此这里不做「读取型三级缓存」，
 * 而是围绕「本地为主、服务端对账」设计：
 *
 * - localStorage 是主存储（含 schema 版本前缀，结构变更自动失效）；
 * - 服务端的全量 GET 是副本，用于跨设备/跨标签页对账；
 * - reconcile 以 updatedAt 较新者为准做字段级合并，永不丢弃 nodes；
 * - 删除通过墓碑（deletedIds）跨设备传播。
 */

import type { Workflow } from '@/types';

// schema 版本前缀：Workflow 结构变更时自增，旧键自动失效
const LS_VERSION = 1;
const STORAGE_KEY = `bitable_workflows:v${LS_VERSION}`;
const LEGACY_KEY = 'bitable_workflows'; // 兼容升级前的旧键（一次性迁移）

/** 读取本地工作流（SSR 安全；旧键存在则按新键口径返回，下次保存时落新键） */
export function loadLocalWorkflows(): Workflow[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = window.localStorage.getItem(LEGACY_KEY); // 迁移期兼容
    return raw ? (JSON.parse(raw) as Workflow[]) : [];
  } catch {
    return [];
  }
}

/** 写入本地工作流（始终写版本化键） */
export function saveLocalWorkflows(workflows: Workflow[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  } catch {
    // 配额超限（隐私模式/体积过大）静默失败，不影响内存态
  }
}

/**
 * 合并本地与服务端工作流（纯函数，便于两页面复用与测试）。
 *
 * 规则：
 * 1. 先以本地为基准，剔除被「其他设备」删除的（id ∈ deletedIds）；
 * 2. 再逐条与服务端对账：服务端较新（updatedAt 更大）则采用服务端
 *    （服务端全量 GET 含 nodes，故不会丢节点）；本地较新则保留本地；
 * 3. 仅本地存在、且未被删除的记录予以保留，等待下次保存时上行同步。
 */
export function reconcileWorkflows(
  local: Workflow[],
  server: Workflow[],
  deletedIds: string[],
): Workflow[] {
  const deleted = new Set(deletedIds);
  const result = new Map<string, Workflow>();

  for (const w of local) {
    if (!deleted.has(w.id)) result.set(w.id, w);
  }

  for (const s of server) {
    if (deleted.has(s.id)) continue;
    const l = result.get(s.id);
    if (!l || new Date(s.updatedAt).getTime() > new Date(l.updatedAt).getTime()) {
      result.set(s.id, s); // 服务端较新（含完整 nodes）
    }
    // 否则保留本地较新版本
  }

  return Array.from(result.values());
}

/** 从服务端拉取全量工作流（含 nodes）与墓碑集合 */
export async function fetchServerWorkflows(): Promise<{
  workflows: Workflow[];
  deletedIds: string[];
}> {
  const r = await fetch('/api/workflows');
  if (!r.ok) throw new Error(`同步失败 (${r.status})`);
  const data = await r.json();
  return {
    workflows: (data.workflows as Workflow[]) || [],
    deletedIds: (data.deletedIds as string[]) || [],
  };
}

/**
 * 计算一次双向同步的结果（纯函数，便于复用与测试）。
 *
 * - merged：拉取合并后的本地视图（pull，详见 reconcileWorkflows）；
 * - push：需要上行到服务端的本地变更集合（push），使数据库成为跨设备中枢：
 *     1. 本地独有（服务端不存在且未被删除）→ 上行（覆盖离线创建/上次 POST 静默失败）；
 *     2. 本地较新（updatedAt 更大）→ 上行（last-write-wins，与 pull 同一语义）；
 *     3. 已在墓碑中的 → 不上行（避免复活被其他设备删除的流程）。
 *
 * 仅 push 这两个集合，绝不删除服务端其他记录，因此天然跨设备安全。
 */
export interface SyncResult {
  merged: Workflow[];
  push: Workflow[];
}

export function computeSync(
  local: Workflow[],
  server: Workflow[],
  deletedIds: string[],
): SyncResult {
  const merged = reconcileWorkflows(local, server, deletedIds);
  const serverMap = new Map(server.map((w) => [w.id, w]));
  const push = local.filter((l) => {
    if (deletedIds.includes(l.id)) return false; // 别复活被其他设备删的
    const s = serverMap.get(l.id);
    if (!s) return true; // 本地独有 → 上行
    return new Date(l.updatedAt).getTime() > new Date(s.updatedAt).getTime(); // 本地较新 → 上行
  });
  return { merged, push };
}
