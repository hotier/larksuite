/**
 * 前端 API 客户端 — 所有数据获取路径的入口
 *
 * 数据流：
 *   前端组件 → lib/api.ts → POST /api/bitable → services/feishu-bitable.ts → 飞书开放平台
 *
 * ⚠️ Token 不再存储于 localStorage，改为 HttpOnly Cookie 自动携带：
 *   - OAuth 回调后，服务端将 token 写入 HttpOnly Cookie（JS 不可读，防 XSS）
 *   - 所有 API 请求携带 credentials: 'include'，Cookie 自动发送
 *   - 前端通过 checkAuthStatus() 获知登录状态
 */

import type {
  ApiResponse,
  App,
  BitableRecord,
  Field,
  ListAppsData,
  ListRecordsData,
  ListTablesData,
  OAuthUrlData,
  Table,
  FieldType,
} from '@/types';

const API_URL = '/api/bitable';

// ====== 模块级缓存：避免页面切换时重复请求 ======
// 采用「会话内缓存 + 事件失效」策略：不设置明确过期时间，
// 缓存仅在整页刷新时清空（内存存储，非 localStorage）。
// 数据更新依赖两类异步事件：① 应用内变更（新建/删除）后主动失效；
// ② 用户点击「同步」按钮强制重新拉取。

interface AppsCacheEntry {
  data: ListAppsData;
  timestamp: number;
}
let appsCache: AppsCacheEntry | null = null;

/** 清除 apps 缓存（用户登出或显式刷新时调用） */
export function invalidateAppsCache() {
  appsCache = null;
}

/**
 * 统一 API 请求封装
 * Token 通过 HttpOnly Cookie 自动携带，前端无需手动处理
 */
async function request<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // ← 携带 HttpOnly Cookie
    body: JSON.stringify(body),
  });

  const result: ApiResponse<T> & { feishuCode?: number; feishuMsg?: string } = await response.json();

  if (!result.success) {
    let errMsg = result.error || '请求失败';
    if (result.feishuCode !== undefined) {
      errMsg += ` [飞书 ${result.feishuCode}: ${result.feishuMsg || '未知'}]`;
    }
    throw new Error(errMsg);
  }

  return result.data;
}

// ====== OAuth 授权 ======

/** 获取飞书 OAuth 授权 URL */
export async function fetchOAuthUrl(): Promise<string> {
  const data = await request<OAuthUrlData>({ action: 'getOAuthUrl' });
  return data.url;
}

/**
 * 检查认证状态（直接读取 Cookie，不再需要额外交换步骤）
 * Token 已在 OAuth 回调时直接写入 HttpOnly Cookie
 */
export async function exchangeAuthCode(): Promise<boolean> {
  return checkAuthStatus();
}

/** 检查当前认证状态 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const data = await request<{ authenticated: boolean }>({ action: 'authStatus' });
    return data.authenticated;
  } catch {
    return false;
  }
}

/** 登出 — 清除 HttpOnly Cookie + 服务端 token */
export async function logout(): Promise<void> {
  await request<{ ok: boolean }>({ action: 'logout' });
  invalidateAppsCache();
}

// ====== 多维表格应用 (Apps) ======

export interface ListAppsResult {
  data: ListAppsData;
  fromCache: boolean;
}

/** 获取所有多维表格应用列表（带模块级缓存，会话内有效、无明确过期） */
export async function listApps(): Promise<ListAppsResult> {
  if (appsCache) {
    return { data: appsCache.data, fromCache: true };
  }
  const data = await request<ListAppsData>({ action: 'listApps' });
  appsCache = { data, timestamp: Date.now() };
  return { data, fromCache: false };
}

/** 强制刷新应用列表（跳过缓存） */
export async function refreshApps(): Promise<ListAppsResult> {
  appsCache = null;
  return listApps();
}

/** 创建新的多维表格应用 */
export async function createApp(name: string, folderToken?: string): Promise<App> {
  return request<App>({ action: 'createApp', appName: name, folderToken });
}

// ====== 云文档 (Docx) ======

// 会话内缓存（无明确过期），按 folderToken 索引；仅缓存首页（pageToken 为空）
const docsCache = new Map<string, { data: ListAppsData; ts: number }>();

/** 清除云文档缓存（新建/删除/登出时调用）；不传 folderToken 则清空全部 */
export function invalidateDocsCache(folderToken = ''): void {
  if (folderToken === '') docsCache.clear();
  else docsCache.delete(folderToken);
}

export async function listDocs(pageSize = 100, pageToken = '', folderToken = ''): Promise<ListAppsData> {
  if (pageToken === '') {
    const cached = docsCache.get(folderToken);
    if (cached) return cached.data;
  }
  const data = await request<ListAppsData>({ action: 'listDocs', pageSize, pageToken, folderToken });
  if (pageToken === '') docsCache.set(folderToken, { data, ts: Date.now() });
  return data;
}

/** 强制刷新云文档列表（绕过缓存重新拉取并更新缓存） */
export async function refreshDocs(folderToken = ''): Promise<ListAppsData> {
  invalidateDocsCache(folderToken);
  return listDocs(100, '', folderToken);
}

export async function createDoc(title: string, folderToken?: string): Promise<App> {
  return request<App>({ action: 'createDoc', appName: title, folderToken });
}

// ====== 在线表格 (Sheet) ======

// 会话内缓存（无明确过期），按 folderToken 索引；仅缓存首页（pageToken 为空）
const sheetsCache = new Map<string, { data: ListAppsData; ts: number }>();

/** 清除在线表格缓存（新建/删除/登出时调用）；不传 folderToken 则清空全部 */
export function invalidateSheetsCache(folderToken = ''): void {
  if (folderToken === '') sheetsCache.clear();
  else sheetsCache.delete(folderToken);
}

export async function listSheets(pageSize = 100, pageToken = '', folderToken = ''): Promise<ListAppsData> {
  if (pageToken === '') {
    const cached = sheetsCache.get(folderToken);
    if (cached) return cached.data;
  }
  const data = await request<ListAppsData>({ action: 'listSheets', pageSize, pageToken, folderToken });
  if (pageToken === '') sheetsCache.set(folderToken, { data, ts: Date.now() });
  return data;
}

/** 强制刷新在线表格列表（绕过缓存重新拉取并更新缓存） */
export async function refreshSheets(folderToken = ''): Promise<ListAppsData> {
  invalidateSheetsCache(folderToken);
  return listSheets(100, '', folderToken);
}

export async function createSheet(title: string, folderToken?: string): Promise<App> {
  return request<App>({ action: 'createSheet', appName: title, folderToken });
}

// ====== 文件删除（通用） ======

export async function deleteFile(fileToken: string, fileType: string): Promise<void> {
  return request<void>({ action: 'deleteFile', fileToken, fileType });
}

// ====== 数据表 (Tables) ======

/** 前端 tables 缓存（key = appToken，页面切换不丢失） */
const TABLES_CACHE_TTL = 10 * 60 * 1000; // 10 分钟
const tablesCache = new Map<string, { data: ListTablesData; ts: number }>();

/** 前端 fields 缓存（key = appToken:tableId） */
const FIELDS_CACHE_TTL = 10 * 60 * 1000;
const fieldsCache = new Map<string, { data: Field[]; ts: number }>();

/** 清除指定 appToken 相关的 tables + fields 缓存 */
export function invalidateTableCache(appToken: string, tableId?: string) {
  tablesCache.delete(appToken);
  if (tableId) {
    fieldsCache.delete(`${appToken}:${tableId}`);
  } else {
    // 模糊删除该 app 下所有 fields 缓存
    for (const key of fieldsCache.keys()) {
      if (key.startsWith(`${appToken}:`)) fieldsCache.delete(key);
    }
  }
}

export async function listTables(appToken: string, pageSize = 100, pageToken = ''): Promise<ListTablesData> {
  const cached = tablesCache.get(appToken);
  if (cached && Date.now() - cached.ts < TABLES_CACHE_TTL) {
    return cached.data;
  }
  const data = await request<ListTablesData>({ action: 'listTables', appToken, pageSize, pageToken });
  tablesCache.set(appToken, { data, ts: Date.now() });
  return data;
}

export async function createTable(appToken: string, tableName: string, fields: { name: string; type: FieldType }[]): Promise<Table> {
  const result = await request<Table>({ action: 'createTable', appToken, tableName, fields });
  invalidateTableCache(appToken);
  return result;
}

export async function deleteTable(appToken: string, tableId: string): Promise<void> {
  await request<void>({ action: 'deleteTable', appToken, tableId });
  invalidateTableCache(appToken, tableId);
}

export async function listFields(appToken: string, tableId: string, pageSize = 100, pageToken = ''): Promise<Field[]> {
  const key = `${appToken}:${tableId}`;
  const cached = fieldsCache.get(key);
  if (cached && Date.now() - cached.ts < FIELDS_CACHE_TTL) {
    return cached.data;
  }
  const data = await request<Field[]>({ action: 'listFields', appToken, tableId, pageSize, pageToken });
  fieldsCache.set(key, { data, ts: Date.now() });
  return data;
}

// ====== 记录 (Records) ======

export async function listRecords(appToken: string, tableId: string, pageSize = 100, pageToken = ''): Promise<ListRecordsData> {
  return request<ListRecordsData>({ action: 'list', appToken, tableId, pageSize, pageToken });
}

export async function readRecord(appToken: string, tableId: string, recordId: string): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'read', appToken, tableId, recordId });
}

export async function createRecord(appToken: string, tableId: string, fields: Record<string, unknown>): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'create', appToken, tableId, fields });
}

export async function updateRecord(appToken: string, tableId: string, recordId: string, fields: Record<string, unknown>): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'update', appToken, tableId, recordId, fields });
}

export async function deleteApiRecord(appToken: string, tableId: string, recordId: string): Promise<string> {
  return request<string>({ action: 'delete', appToken, tableId, recordId });
}
