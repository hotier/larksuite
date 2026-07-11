/**
 * 浏览器本地缓存（三层缓存的「第一层」）
 *
 * 基于 localStorage，跨刷新持久化。与 lib/api.ts 的会话内内存缓存（瞬时二次命中）、
 * 服务端的 lib/cache.ts（第二层）共同组成
 * 「浏览器本地 → 服务端内存 → 数据源（飞书/DB）」的三级缓存。
 *
 * 设计要点：
 * - SSR 安全：无 window（服务端渲染）时所有操作降级为 no-op / 返回 null。
 * - 配额安全：写入超容（5MB 上限、隐私模式）时静默失败，不影响功能。
 * - TTL 过期自动清理，避免脏数据长期滞留。
 */

// schema 版本前缀：数据结构变更时自增，旧版本键自动失效（读/写用版本化前缀，
// 清空用 BASE，确保跨版本不会误读旧结构；旧键残留会在 clearAll 时一并清除）。
const BASE = 'lark_cache:';
const CACHE_VERSION = 1;
const PREFIX = `${BASE}v${CACHE_VERSION}:`;

interface Entry<T> {
  v: T;
  ts: number;
  ttl: number;
}

export function clientCacheGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.ts > entry.ttl) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.v;
  } catch {
    return null;
  }
}

export function clientCacheSet<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ v: value, ts: Date.now(), ttl: ttlMs } as Entry<T>),
    );
  } catch {
    // 配额超限 / 隐私模式：静默降级（仅丢失本地层，功能不受影响）
  }
}

export function clientCacheDel(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* no-op */
  }
}

/** 清空本应用写入的所有本地缓存键（登出时调用） */
export function clientCacheClearAll(): void {
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(BASE)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* no-op */
  }
}
