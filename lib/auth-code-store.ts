/**
 * 一次性授权码存储
 *
 * OAuth 回调后不在 URL 中传递 token，而是生成一个短时效的一次性 code，
 * 前端用 code 调用 API 换取 token，确保 token 不出现在浏览器地址栏、历史记录和日志中。
 *
 * 使用内存 Map（服务重启后失效，但 code 有效期仅 60 秒，影响可接受）
 */

import crypto from 'crypto';

interface CodeEntry {
  accessToken: string;
  refreshToken: string;
  expire: number;    // access_token 过期时间戳(ms)
  createdAt: number;
}

const store = new Map<string, CodeEntry>();

/** code 有效期 60 秒 */
const CODE_TTL_MS = 60_000;

/** 定期清理过期 code，防止内存泄漏（每 2 分钟） */
const CLEANUP_INTERVAL = 120_000;
let cleanupStarted = false;

function startCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of store) {
      if (now - entry.createdAt > CODE_TTL_MS) {
        store.delete(code);
      }
    }
  }, CLEANUP_INTERVAL);
}

/** 存入 token，返回一次性 code */
export function setCode(entry: {
  accessToken: string;
  refreshToken: string;
  expire: number;
}): string {
  startCleanup();
  const code = crypto.randomBytes(32).toString('hex');
  store.set(code, { ...entry, createdAt: Date.now() });
  return code;
}

/** 用 code 换取 token，取出后立即删除（一次性使用） */
export function exchangeCode(code: string): CodeEntry | null {
  const entry = store.get(code);
  if (!entry) return null;

  // 检查是否过期
  if (Date.now() - entry.createdAt > CODE_TTL_MS) {
    store.delete(code);
    return null;
  }

  // 一次性使用，取出即删
  store.delete(code);
  return entry;
}
