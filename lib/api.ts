/**
 * 前端 API 客户端 — 所有数据获取路径的入口
 *
 * 数据流：
 *   前端组件 → lib/api.ts → POST /api/bitable → services/feishu-bitable.ts → 飞书开放平台
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
// Next.js App Router 在路由切换时会卸载/挂载页面组件，
// 但同一 JS 模块在客户端 SPA 中保持存活，因此模块级变量可跨导航持久化。
const APPS_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

interface AppsCacheEntry {
  data: ListAppsData;
  timestamp: number;
}
let appsCache: AppsCacheEntry | null = null;

/** 清除 apps 缓存（用户登出或显式刷新时调用） */
export function invalidateAppsCache() {
  appsCache = null;
}

/** 从 localStorage 获取保存的用户 token 信息 */
function getStoredAuth(): { userToken: string | null; tokenExpire: string | null } {
  if (typeof window === 'undefined') return { userToken: null, tokenExpire: null };
  return {
    userToken: localStorage.getItem('feishu_user_token'),
    tokenExpire: localStorage.getItem('feishu_token_expire'),
  };
}

/**
 * 统一 API 请求封装
 * 自动附加用户 token，统一的错误处理
 */
async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { userToken, tokenExpire } = getStoredAuth();
  const isAuth = !!userToken;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      useUserToken: isAuth,
      userToken,
      tokenExpire,
    }),
  });

  const result: ApiResponse<T> & { feishuCode?: number; feishuMsg?: string } = await response.json();

  if (!result.success) {
    let errMsg = result.error || '请求失败';
    // 附加飞书 API 的原始错误信息
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
 * 用 Cookie 中的一次性授权码换取 token（OAuth 回调后前端自动调用）
 * 不走常规 request 函数（此时用户尚未认证），cookie 自动携带
 */
export async function exchangeAuthCode(): Promise<{
  accessToken: string;
  refreshToken: string;
  expire: number;
} | null> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'exchangeAuthCode' }),
  });
  const result = await response.json();
  if (!result.success) return null;
  return result.data;
}

// ====== 多维表格应用 (Apps) ======

/** listApps 返回结果，包含数据和是否来自缓存的标记 */
export interface ListAppsResult {
  data: ListAppsData;
  fromCache: boolean;
}

/** 获取所有多维表格应用列表（带模块级缓存，避免页面切换重复请求） */
export async function listApps(): Promise<ListAppsResult> {
  if (appsCache && Date.now() - appsCache.timestamp < APPS_CACHE_TTL) {
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
export async function createApp(
  name: string,
  folderToken?: string
): Promise<App> {
  const data = await request<App>({ action: 'createApp', appName: name, folderToken });
  return data;
}

// ====== 云文档 (Docx) ======

/** 获取所有云文档列表（带模块级缓存） */
export async function listDocs(
  pageSize = 100,
  pageToken = '',
  folderToken = ''
): Promise<ListAppsData> {
  return request<ListAppsData>({ action: 'listDocs', pageSize, pageToken, folderToken });
}

/** 创建云文档 */
export async function createDoc(
  title: string,
  folderToken?: string
): Promise<App> {
  const data = await request<App>({ action: 'createDoc', appName: title, folderToken });
  return data;
}

// ====== 在线表格 (Sheet) ======

/** 获取所有在线表格列表（带模块级缓存） */
export async function listSheets(
  pageSize = 100,
  pageToken = '',
  folderToken = ''
): Promise<ListAppsData> {
  return request<ListAppsData>({ action: 'listSheets', pageSize, pageToken, folderToken });
}

/** 创建在线表格 */
export async function createSheet(
  title: string,
  folderToken?: string
): Promise<App> {
  const data = await request<App>({ action: 'createSheet', appName: title, folderToken });
  return data;
}

// ====== 文件删除（通用） ======

/** 删除云文件（支持 docx/sheet 等类型） */
export async function deleteFile(fileToken: string, fileType: string): Promise<void> {
  return request<void>({ action: 'deleteFile', fileToken, fileType });
}

// ====== 数据表 (Tables) ======

/** 获取指定应用下的数据表列表 */
export async function listTables(
  appToken: string,
  pageSize = 100,
  pageToken = ''
): Promise<ListTablesData> {
  return request<ListTablesData>({ action: 'listTables', appToken, pageSize, pageToken });
}

/** 创建数据表 */
export async function createTable(
  appToken: string,
  tableName: string,
  fields: { name: string; type: FieldType }[]
): Promise<Table> {
  return request<Table>({ action: 'createTable', appToken, tableName, fields });
}

/** 删除数据表 */
export async function deleteTable(appToken: string, tableId: string): Promise<void> {
  return request<void>({ action: 'deleteTable', appToken, tableId });
}

/** 获取表的字段列表 */
export async function listFields(
  appToken: string,
  tableId: string,
  pageSize = 100,
  pageToken = ''
): Promise<Field[]> {
  return request<Field[]>({ action: 'listFields', appToken, tableId, pageSize, pageToken });
}

// ====== 记录 (Records) ======

/** 获取记录列表 */
export async function listRecords(
  appToken: string,
  tableId: string,
  pageSize = 100,
  pageToken = ''
): Promise<ListRecordsData> {
  return request<ListRecordsData>({ action: 'list', appToken, tableId, pageSize, pageToken });
}

/** 读取单条记录 */
export async function readRecord(
  appToken: string,
  tableId: string,
  recordId: string
): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'read', appToken, tableId, recordId });
}

/** 创建记录 */
export async function createRecord(
  appToken: string,
  tableId: string,
  fields: Record<string, unknown>
): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'create', appToken, tableId, fields });
}

/** 更新记录 */
export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<BitableRecord> {
  return request<BitableRecord>({ action: 'update', appToken, tableId, recordId, fields });
}

/** 删除记录 */
export async function deleteApiRecord(
  appToken: string,
  tableId: string,
  recordId: string
): Promise<string> {
  return request<string>({ action: 'delete', appToken, tableId, recordId });
}
