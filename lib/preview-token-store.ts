/**
 * 预览参数短 Token 存储（PostgreSQL + 内存缓存）
 *
 * 将文件预览参数映射为短 ID，避免长参数出现在 URL 中。
 * 兼容 Vercel serverless ephemeral filesystem。
 *
 * 架构：
 * - 内存缓存层：零延迟读写，实例生命周期内所有操作走内存
 * - 数据库持久化：仅用于跨实例恢复（冷启动时加载）
 * - 清理策略：DB 清理收敛到 loadFromDb（每次冷启动执行一次，先删后查）
 * - 去重加速：fileToken → id 的额外映射表 O(1) 查找
 *
 * TTL：30 分钟（与飞书临时下载链接保持一致）
 */

import crypto from 'crypto';
import { sql } from '@/lib/db';

const TTL_MS = 30 * 60 * 1000; // 30 分钟

export interface TokenEntry {
  fileToken: string;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  fileName: string;
  createdAt: number;
}

// ── 内存缓存层 ──
let store: Map<string, TokenEntry> | undefined;
let fileTokenIndex: Map<string, string> | undefined; // fileToken → id，加速去重

// ── 初始化（冷启动时执行一次：先清 DB 过期数据，再加载有效数据）──

async function loadFromDb(): Promise<Map<string, TokenEntry>> {
  const result = new Map<string, TokenEntry>();
  try {
    const now = Date.now();

    // 步骤1：删除 DB 中所有过期条目（利用 created_at 索引，O(log n)）
    // 这是实例生命周期内唯一一次 DB 清理
    await sql()`
      DELETE FROM preview_tokens
      WHERE ${now} - created_at > ${TTL_MS}
    `;

    // 步骤2：加载剩余有效数据
    const rows = await sql()`
      SELECT id, file_token, table_id, field_id, record_id, file_name, created_at
      FROM preview_tokens
      ORDER BY created_at ASC
    `;

    for (const r of rows) {
      result.set(r.id as string, {
        fileToken: r.file_token as string,
        tableId: (r.table_id as string) || undefined,
        fieldId: (r.field_id as string) || undefined,
        recordId: (r.record_id as string) || undefined,
        fileName: r.file_name as string,
        createdAt: Number(r.created_at),
      });
    }
  } catch (err) {
    console.error('[preview-token-store] 从数据库加载失败:', err);
  }
  return result;
}

async function ensureStore(): Promise<void> {
  if (store) return;
  store = await loadFromDb();
  // 构建 fileToken → id 索引
  fileTokenIndex = new Map();
  for (const [id, entry] of store) {
    fileTokenIndex.set(entry.fileToken, id);
  }
}

// ── DB 写入（异步 fire-and-forget）──

async function saveEntryToDb(id: string, entry: TokenEntry): Promise<void> {
  await sql()`
    INSERT INTO preview_tokens (id, file_token, table_id, field_id, record_id, file_name, created_at)
    VALUES (${id}, ${entry.fileToken}, ${entry.tableId ?? null},
      ${entry.fieldId ?? null}, ${entry.recordId ?? null},
      ${entry.fileName}, ${entry.createdAt})
    ON CONFLICT (id) DO NOTHING
  `;
}

// ── 内部辅助 ──

function generateId(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

/** 清理内存中过期条目（O(n) 遍历 Map，不涉及 DB） */
function cleanExpired(): void {
  if (!store) return;
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
      fileTokenIndex?.delete(entry.fileToken);
    }
  }
}

// ── 公开 API ──

/**
 * 存储文件参数并返回短 ID（去重：相同 fileToken 复用已有 ID）
 *
 * 内存写入同步完成（返回值立即可用），DB 持久化异步执行不阻塞。
 */
export async function savePreviewToken(params: Omit<TokenEntry, 'createdAt'>): Promise<string> {
  await ensureStore();
  cleanExpired();

  // O(1) 去重查找
  const existingId = fileTokenIndex?.get(params.fileToken);
  if (existingId) return existingId;

  const id = generateId();
  const entry: TokenEntry = { ...params, createdAt: Date.now() };
  store!.set(id, entry);
  fileTokenIndex?.set(params.fileToken, id);

  // 异步写 DB（fire-and-forget，不阻塞返回）
  saveEntryToDb(id, entry).catch((err) =>
    console.error('[preview-token-store] 写入数据库失败:', err)
  );

  return id;
}

/**
 * 根据短 ID 获取文件参数，不存在或过期返回 null
 *
 * 纯内存操作，零 DB 开销。
 */
export async function getPreviewToken(id: string): Promise<TokenEntry | null> {
  await ensureStore();
  const entry = store?.get(id);
  if (!entry) return null;

  if (Date.now() - entry.createdAt > TTL_MS) {
    store?.delete(id);
    fileTokenIndex?.delete(entry.fileToken);
    return null;
  }

  return entry;
}
