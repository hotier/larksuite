/**
 * 飞书认证常量 — 统一入口，避免各文件重复定义。
 *
 * Cookie 中存储的是 AES-256-GCM 加密后的飞书 access_token（HttpOnly），
 * 浏览器 DevTools 中看到的是 base64url 密文，无法直接获取原始 token。
 * Cookie token 值仅作会话有效性判定（判空+判过期），
 * 实际 API 调用由 feishuService 从 DB 管理真实 token。
 */

/** HttpOnly Cookie 名称：存储加密后的飞书 access_token */
export const TOKEN_COOKIE = 'feishu_token';
export const EXPIRE_COOKIE = 'feishu_token_expire';

/** 会话寿命（秒），跟随 refresh_token 有效期（最长 30 天） */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
