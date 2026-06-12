export interface BitableRecord {
  record_id: string;
  fields: { [key: string]: unknown };
  created_time: string;
  updated_time: string;
}

export interface ListRecordsResponse {
  records: BitableRecord[];
  has_more: boolean;
  page_token: string;
  total: number;
}

export interface Field {
  field_id: string;
  name: string;
  type: FieldType;
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'single_select' 
  | 'multi_select' 
  | 'checkbox' 
  | 'person' 
  | 'phone' 
  | 'email' 
  | 'url' 
  | 'file' 
  | 'formula' 
  | 'lookup' 
  | 'created_time' 
  | 'created_by' 
  | 'updated_time' 
  | 'updated_by';

export interface Table {
  table_id: string;
  name: string;
  fields?: Field[];
  created_time: string;
  updated_time: string;
}

export interface ListTablesResponse {
  tables: Table[];
}

export interface App {
  app_token: string;
  name: string;
  url: string;
  folder_token: string;
  create_time: string;
  update_time: string;
  creator_id: string;
  owner_id: string;
}

export interface ListAppsResponse {
  apps: App[];
  has_more: boolean;
  page_token: string;
}

export interface BitableAction {
  action: 'list' | 'read' | 'create' | 'update' | 'delete' | 'listTables' | 'createTable' | 'deleteTable' | 'listApps';
  appToken?: string;
  tableId?: string;
  recordId?: string;
  fields?: { [key: string]: unknown } | { name: string; type: FieldType }[];
  tableName?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface UserAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  user_access_token: string;
  expire: number;
  token_type: string;
}

export interface OAuthState {
  state: string;
  redirectUri: string;
}