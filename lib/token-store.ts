/**
 * 服务端用户 Token 持久化存储
 *
 * 将飞书 OAuth 的 user_access_token 和 refresh_token 持久化到文件，
 * 确保服务重启后 webhook 仍能使用有效的用户身份操作表格。
 *
 * 数据文件：data/user-token.json
 */

import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'data', 'user-token.json');

export interface StoredToken {
  /** 飞书 user_access_token */
  accessToken: string;
  /** access_token 的过期时间戳（毫秒） */
  accessTokenExpireAt: number;
  /** 飞书 refresh_token（有效期约 30 天） */
  refreshToken: string;
  /** refresh_token 的过期时间戳（毫秒） */
  refreshTokenExpireAt: number;
  /** 最后更新时间 ISO */
  updatedAt: string;
}

function ensureStoreDir(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** 从文件加载持久化的 token */
export function loadToken(): StoredToken | null {
  try {
    if (!fs.existsSync(STORE_PATH)) return null;
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const token: StoredToken = JSON.parse(raw);

    // 检查 access_token 是否已过期
    if (Date.now() >= token.accessTokenExpireAt) {
      // access_token 过期但 refresh_token 还有效 → 返回给调用方自行刷新
      if (Date.now() < token.refreshTokenExpireAt) {
        return token; // refresh_token 还有效
      }
      // 都过期了
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

/** 将 token 持久化到文件 */
export function saveToken(token: {
  accessToken: string;
  accessTokenExpireAt: number;
  refreshToken: string;
  refreshTokenExpireAt: number;
}): void {
  ensureStoreDir();
  const stored: StoredToken = {
    ...token,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STORE_PATH, JSON.stringify(stored, null, 2), 'utf-8');
}

/** 删除持久化的 token（用户登出时调用） */
export function deleteToken(): void {
  try {
    if (fs.existsSync(STORE_PATH)) {
      fs.unlinkSync(STORE_PATH);
    }
  } catch {
    // 忽略删除失败
  }
}
