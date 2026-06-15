import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface TokenEntry {
  fileToken: string;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  fileName: string;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'preview-tokens.json');

// 30 分钟过期（飞书临时下载链接也会过期）
const TTL_MS = 30 * 60 * 1000;

/** 确保 data 目录存在 */
function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** 读取存储（自动清除过期条目） */
function readStore(): Map<string, TokenEntry> {
  ensureDir();
  const store = new Map<string, TokenEntry>();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const entries: [string, TokenEntry][] = JSON.parse(raw);
      const now = Date.now();
      for (const [id, entry] of entries) {
        if (now - entry.createdAt <= TTL_MS) {
          store.set(id, entry);
        }
      }
    }
  } catch {
    // 文件损坏或不存在，从空开始
  }
  return store;
}

/** 写入存储 */
function writeStore(store: Map<string, TokenEntry>): void {
  ensureDir();
  const entries = Array.from(store.entries());
  // 原子写入：先写临时文件再 rename
  const tmpFile = STORE_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(entries), 'utf-8');
  fs.renameSync(tmpFile, STORE_FILE);
}

/** 生成 8 位随机短 ID */
function generateId(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

/** 存储文件参数并返回短 ID */
export function savePreviewToken(params: Omit<TokenEntry, 'createdAt'>): string {
  const store = readStore();

  // 去重：相同 fileToken 复用已有 ID
  for (const [id, entry] of store) {
    if (entry.fileToken === params.fileToken) return id;
  }

  const id = generateId();
  store.set(id, { ...params, createdAt: Date.now() });
  writeStore(store);
  return id;
}

/** 根据短 ID 获取文件参数，不存在或过期返回 null */
export function getPreviewToken(id: string): TokenEntry | null {
  const store = readStore();
  const entry = store.get(id);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(id);
    writeStore(store);
    return null;
  }
  return entry;
}
