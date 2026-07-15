/** 飞书认证 Cookie 名称常量 — 统一入口，避免各文件重复定义 */
export const TOKEN_COOKIE = 'feishu_token';
export const EXPIRE_COOKIE = 'feishu_token_expire';

/** 会话寿命（秒），与飞书 access_token 解耦，跟随 refresh_token 有效期（最长 30 天） */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
