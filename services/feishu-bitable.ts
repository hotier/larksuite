import axios from 'axios';

interface AccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface UserAccessTokenResponse {
  code: number;
  msg: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
  scope: string;
  token_type: string;
}

interface BitableResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface BitableRecord {
  record_id: string;
  fields: { [key: string]: unknown };
  created_time: string;
  updated_time: string;
}

interface ListRecordsResponse {
  records: BitableRecord[];
  has_more: boolean;
  page_token: string;
  total: number;
}

interface CreateRecordResponse {
  record: BitableRecord;
}

interface UpdateRecordResponse {
  record_id: string;
}

interface DeleteRecordResponse {
  record_id: string;
}

interface Table {
  table_id: string;
  name: string;
  fields: Field[];
  created_time: string;
  updated_time: string;
}

interface Field {
  field_id: string;
  name: string;
  type: FieldType;
}

type FieldType = 
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

interface ListTablesResponse {
  items: Table[];
  page_token: string;
  has_more: boolean;
}

interface CreateTableResponse {
  table: Table;
}

interface App {
  app_token: string;
  name: string;
  url: string;
  folder_token: string;
  create_time: string;
  update_time: string;
  creator_id: string;
  owner_id: string;
}

interface ListAppsResponse {
  files: App[];
  has_more: boolean;
  page_token: string;
}

interface DriveFile {
  token: string;
  name: string;
  type: string;
  url: string;
  parent_token: string;
}

class FeishuBitable {
  private tenantAccessToken: string | null = null;
  private tenantTokenExpireTime = 0;
  private userAccessToken: string | null = null;
  private userTokenExpireTime = 0;
  private refreshToken: string | null = null;
  private refreshTokenExpireTime = 0;
  private appId = process.env.APP_ID || '';
  private appSecret = process.env.APP_SECRET || '';
  private redirectUri = process.env.REDIRECT_URI || 'http://localhost:3001/api/bitable/oauth/callback';

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tenantAccessToken && now < this.tenantTokenExpireTime) {
      return this.tenantAccessToken;
    }

    const response = await axios.post<AccessTokenResponse>(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: this.appId,
        app_secret: this.appSecret,
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`获取TenantAccessToken失败: ${response.data.msg}`);
    }

    this.tenantAccessToken = response.data.tenant_access_token;
    this.tenantTokenExpireTime = now + (response.data.expire - 60) * 1000;

    return this.tenantAccessToken;
  }

  async getUserAccessToken(code: string): Promise<{ accessToken: string; refreshToken: string; expire: number }> {
    const response = await axios.post<UserAccessTokenResponse>(
      'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: this.appId,
        client_secret: this.appSecret,
        code,
        redirect_uri: this.redirectUri,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`获取UserAccessToken失败 [${response.data.code}]: ${response.data.msg}`);
    }

    this.userAccessToken = response.data.access_token;
    this.userTokenExpireTime = Date.now() + (response.data.expires_in - 60) * 1000;
    if (response.data.refresh_token) {
      this.refreshToken = response.data.refresh_token;
      this.refreshTokenExpireTime = Date.now() + (response.data.refresh_token_expires_in - 60) * 1000;
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || '',
      expire: response.data.expires_in,
    };
  }

  async refreshUserAccessToken(): Promise<{ accessToken: string; expire: number }> {
    if (!this.refreshToken) {
      throw new Error('没有 refresh_token，无法刷新');
    }

    const response = await axios.post<UserAccessTokenResponse>(
      'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
      {
        grant_type: 'refresh_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        refresh_token: this.refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`刷新UserAccessToken失败 [${response.data.code}]: ${response.data.msg}`);
    }

    this.userAccessToken = response.data.access_token;
    this.userTokenExpireTime = Date.now() + (response.data.expires_in - 60) * 1000;
    if (response.data.refresh_token) {
      this.refreshToken = response.data.refresh_token;
    }

    return {
      accessToken: response.data.access_token,
      expire: response.data.expires_in,
    };
  }

  setUserAccessToken(token: string, expire: number): void {
    this.userAccessToken = token;
    this.userTokenExpireTime = expire;
  }

  clearUserAccessToken(): void {
    this.userAccessToken = null;
    this.userTokenExpireTime = 0;
    this.refreshToken = null;
    this.refreshTokenExpireTime = 0;
  }

  isUserAuthenticated(): boolean {
    return this.userAccessToken !== null && Date.now() < this.userTokenExpireTime;
  }

  getOAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'bitable:app:readonly bitable:app drive:drive:readonly drive:file:readonly offline_access',
      state: state || '',
    });
    return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
  }

  private async getAccessToken(useUserToken: boolean = false): Promise<string> {
    console.log(`[FeishuBitable] getAccessToken - useUserToken: ${useUserToken}, isUserAuthenticated: ${this.isUserAuthenticated()}`);
    
    if (useUserToken && this.isUserAuthenticated()) {
      console.log(`[FeishuBitable] Using user_access_token`);
      return this.userAccessToken!;
    }
    
    console.log(`[FeishuBitable] Using tenant_access_token`);
    return this.getTenantAccessToken();
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: { [key: string]: unknown },
    useUserToken: boolean = false
  ): Promise<BitableResponse<T>> {
    const token = await this.getAccessToken(useUserToken);
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    console.log(`[FeishuBitable] request - method: ${method}, url: ${url}, useUserToken: ${useUserToken}`);
    console.log(`[FeishuBitable] token type: ${token.startsWith('t-') ? 'tenant_access_token' : token.startsWith('ey') ? 'user_access_token (JWT)' : 'unknown'}, token preview: ${token.substring(0, 20)}...`);

    const config = {
      method,
      url: `https://open.feishu.cn/open-apis${url}`,
      headers,
      data,
    };

    try {
      const response = await axios(config);

      console.log(`[FeishuBitable] response - code: ${response.data.code}, msg: ${response.data.msg}`);

      if (response.data.code !== 0) {
        throw new Error(`API请求失败 [${response.data.code}]: ${response.data.msg}`);
      }

      return response.data;
    } catch (error: any) {
      console.error(`[FeishuBitable] request error - url: ${url}`);
      if (error.response) {
        console.error(`[FeishuBitable] response data:`, JSON.stringify(error.response.data, null, 2));
        console.error(`[FeishuBitable] status: ${error.response.status}`);
      }
      throw error;
    }
  }

  async listRecords(
    appToken: string,
    tableId: string,
    pageSize = 100,
    pageToken = '',
    useUserToken = false
  ): Promise<ListRecordsResponse> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=${pageSize}&page_token=${pageToken}`;
    const result = await this.request<ListRecordsResponse>('get', url, undefined, useUserToken);
    return result.data;
  }

  async readRecord(appToken: string, tableId: string, recordId: string, useUserToken = false): Promise<BitableRecord> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    const result = await this.request<{ record: BitableRecord }>('get', url, undefined, useUserToken);
    return result.data.record;
  }

  async createRecord(
    appToken: string,
    tableId: string,
    fields: { [key: string]: unknown },
    useUserToken = false
  ): Promise<BitableRecord> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
    const result = await this.request<CreateRecordResponse>('post', url, { fields }, useUserToken);
    return result.data.record;
  }

  async updateRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: { [key: string]: unknown },
    useUserToken = false
  ): Promise<string> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    const result = await this.request<UpdateRecordResponse>('put', url, { fields }, useUserToken);
    return result.data.record_id;
  }

  async deleteRecord(appToken: string, tableId: string, recordId: string, useUserToken = false): Promise<string> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
    const result = await this.request<DeleteRecordResponse>('delete', url, undefined, useUserToken);
    return result.data.record_id;
  }

  async listTables(appToken: string, useUserToken = false): Promise<ListTablesResponse> {
    const url = `/bitable/v1/apps/${appToken}/tables`;
    const result = await this.request<ListTablesResponse>('get', url, undefined, useUserToken);
    return result.data;
  }

  async createTable(
    appToken: string,
    name: string,
    fields: { name: string; type: FieldType }[],
    useUserToken = false
  ): Promise<Table> {
    const url = `/bitable/v1/apps/${appToken}/tables`;
    const result = await this.request<CreateTableResponse>('post', url, { name, fields }, useUserToken);
    return result.data.table;
  }

  async deleteTable(appToken: string, tableId: string, useUserToken = false): Promise<void> {
    const url = `/bitable/v1/apps/${appToken}/tables/${tableId}`;
    await this.request<void>('delete', url, undefined, useUserToken);
  }

  async listApps(pageSize = 100, pageToken = '', folderToken = '', useUserToken = false): Promise<ListAppsResponse> {
    console.log(`[FeishuBitable] listApps called - useUserToken: ${useUserToken}, pageSize: ${pageSize}, pageToken: ${pageToken}`);
    
    const url = `/drive/v1/files?page_size=${pageSize}&page_token=${pageToken}${folderToken ? `&folder_token=${folderToken}` : ''}`;
    const result = await this.request<{ data: { files: DriveFile[]; has_more: boolean; page_token: string } }>('get', url, undefined, useUserToken);
    
    console.log(`[FeishuBitable] Drive API response - total files: ${result.data.files.length}, has_more: ${result.data.has_more}`);
    
    const bitableFiles = result.data.files.filter(file => file.type === 'bitable');
    console.log(`[FeishuBitable] Filtered bitable files: ${bitableFiles.length}`);
    
    const apps: App[] = bitableFiles.map(file => ({
      app_token: file.token,
      name: file.name,
      url: file.url,
      folder_token: file.parent_token,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
      creator_id: '',
      owner_id: ''
    }));
    
    console.log(`[FeishuBitable] Returning ${apps.length} apps`);
    
    return {
      files: apps,
      has_more: result.data.has_more,
      page_token: result.data.page_token
    };
  }
}

export const bitableService = new FeishuBitable();
export type { BitableRecord, ListRecordsResponse, Table, Field, FieldType, App, ListAppsResponse };
