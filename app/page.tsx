'use client';

import { useState, useEffect } from 'react';
import { BitableRecord, BitableAction, ApiResponse, Table, Field, FieldType, App } from '@/types';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'single_select', label: '单选' },
  { value: 'multi_select', label: '多选' },
  { value: 'checkbox', label: '复选框' },
  { value: 'person', label: '人员' },
  { value: 'phone', label: '电话' },
  { value: 'email', label: '邮箱' },
  { value: 'url', label: '链接' },
];

export default function Home() {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [appToken, setAppToken] = useState('');
  const [tableId, setTableId] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [records, setRecords] = useState<BitableRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BitableRecord | null>(null);
  const [newFields, setNewFields] = useState<{ [key: string]: unknown }>({});
  const [editingFields, setEditingFields] = useState<{ [key: string]: unknown }>({});
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'tables' | 'records'>('apps');
  const [newTableName, setNewTableName] = useState('');
  const [newTableFields, setNewTableFields] = useState<{ name: string; type: FieldType }[]>([{ name: '', type: 'text' }]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [oauthUrl, setOauthUrl] = useState('');

  const apiUrl = '/api/bitable';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expire = urlParams.get('expire');
    
    if (token) {
      localStorage.setItem('feishu_user_token', token);
      localStorage.setItem('feishu_token_expire', expire || '');
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = localStorage.getItem('feishu_user_token');
    const storedExpire = localStorage.getItem('feishu_token_expire');
    
    if (storedToken && storedExpire) {
      const expireTime = parseInt(storedExpire) * 1000;
      if (Date.now() < expireTime) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('feishu_user_token');
        localStorage.removeItem('feishu_token_expire');
      }
    }

    fetchOAuthUrl();
  }, []);

  const fetchOAuthUrl = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getOAuthUrl' }),
      });
      const result: ApiResponse<{ url: string }> = await response.json();
      if (result.success) {
        setOauthUrl(result.data.url);
      }
    } catch (error) {
      console.error('获取OAuth URL失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('feishu_user_token');
    localStorage.removeItem('feishu_token_expire');
    setIsAuthenticated(false);
    setApps([]);
    setSelectedApp(null);
    setAppToken('');
    setTables([]);
    setRecords([]);
    setSelectedRecord(null);
    setResponseMessage('已退出登录');
  };

  const handleApiRequest = async (action: BitableAction & { useUserToken?: boolean }) => {
    setIsLoading(true);
    setResponseMessage('');
    try {
      const userToken = localStorage.getItem('feishu_user_token');
      const tokenExpire = localStorage.getItem('feishu_token_expire');
      const requestBody = {
        ...action,
        useUserToken: isAuthenticated,
        userToken,
        tokenExpire,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: ApiResponse<unknown> = await response.json();

      console.log('[FeishuBitable] API Response:', action.action, result);

      if (result.success) {
        setResponseMessage(`操作成功: ${JSON.stringify(result.data)}`);
        if (action.action === 'listApps') {
          const appsData = result.data as { files: App[] };
          console.log('[FeishuBitable] Setting apps:', appsData.files?.length);
          setApps(appsData.files || []);
        } else if (action.action === 'listTables') {
          const tablesData = result.data as { items: Table[] };
          console.log('[FeishuBitable] Setting tables:', tablesData.items?.length, tablesData);
          setTables(tablesData.items || []);
        } else if (action.action === 'createTable' || action.action === 'deleteTable') {
          await handleListTables();
        } else if (action.action === 'list') {
          const recordsData = result.data as { items?: BitableRecord[]; records?: BitableRecord[]; data?: BitableRecord[] };
          const records = recordsData.items || recordsData.records || recordsData.data || [];
          console.log('[FeishuBitable] Setting records:', records.length, recordsData);
          setRecords(records);
        } else if (action.action === 'create' || action.action === 'delete') {
          await handleListRecords();
        }
        if (action.action === 'update' && selectedRecord) {
          setSelectedRecord({ ...selectedRecord, fields: { ...selectedRecord.fields, ...action.fields } });
        }
      } else {
        setResponseMessage(`操作失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      setResponseMessage(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListApps = async () => {
    if (!isAuthenticated) {
      setResponseMessage('请先进行 OAuth 授权');
      return;
    }
    await handleApiRequest({ action: 'listApps' });
  };

  const handleSelectApp = (app: App) => {
    setSelectedApp(app);
    setAppToken(app.app_token);
    setActiveTab('tables');
    handleListTables();
  };

  const handleListTables = async () => {
    if (!appToken) {
      setResponseMessage('请先选择一个多维表格');
      return;
    }
    await handleApiRequest({ action: 'listTables', appToken });
  };

  const handleCreateTable = async () => {
    if (!appToken) {
      setResponseMessage('请先选择一个多维表格');
      return;
    }
    if (!newTableName) {
      setResponseMessage('请输入表格名称');
      return;
    }
    const validFields = newTableFields.filter(f => f.name.trim());
    if (validFields.length === 0) {
      setResponseMessage('请至少添加一个字段');
      return;
    }
    await handleApiRequest({ 
      action: 'createTable', 
      appToken, 
      tableName: newTableName,
      fields: validFields 
    });
    setNewTableName('');
    setNewTableFields([{ name: '', type: 'text' }]);
  };

  const handleDeleteTable = async (tableIdToDelete: string, tableName: string) => {
    if (!appToken) {
      setResponseMessage('请先选择一个多维表格');
      return;
    }
    if (confirm(`确定要删除表格 "${tableName}" 吗？此操作不可撤销！`)) {
      await handleApiRequest({ action: 'deleteTable', appToken, tableId: tableIdToDelete });
      if (tableIdToDelete === tableId) {
        setTableId('');
        setRecords([]);
        setSelectedRecord(null);
      }
    }
  };

  const handleSelectTable = (table: Table) => {
    setTableId(table.table_id);
    setActiveTab('records');
    handleListRecords();
  };

  const handleListRecords = async () => {
    if (!appToken || !tableId) {
      setResponseMessage('请先选择多维表格和数据表');
      return;
    }
    await handleApiRequest({ action: 'list', appToken, tableId });
  };

  const handleCreateRecord = async () => {
    if (!appToken || !tableId) {
      setResponseMessage('请先选择多维表格和数据表');
      return;
    }
    if (Object.keys(newFields).length === 0) {
      setResponseMessage('请输入要创建的字段数据');
      return;
    }
    await handleApiRequest({ action: 'create', appToken, tableId, fields: newFields });
    setNewFields({});
  };

  const handleUpdateRecord = async () => {
    if (!selectedRecord) {
      setResponseMessage('请先选择一条记录');
      return;
    }
    if (Object.keys(editingFields).length === 0) {
      setResponseMessage('请输入要更新的字段数据');
      return;
    }
    await handleApiRequest({
      action: 'update',
      appToken,
      tableId,
      recordId: selectedRecord.record_id,
      fields: editingFields,
    });
    setEditingFields({});
    setSelectedRecord(null);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!appToken || !tableId) {
      setResponseMessage('请先选择多维表格和数据表');
      return;
    }
    if (confirm('确定要删除这条记录吗？')) {
      await handleApiRequest({ action: 'delete', appToken, tableId, recordId });
      setSelectedRecord(null);
    }
  };

  const handleReadRecord = async (recordId: string) => {
    if (!appToken || !tableId) {
      setResponseMessage('请先选择多维表格和数据表');
      return;
    }
    await handleApiRequest({ action: 'read', appToken, tableId, recordId });
  };

  const handleFieldInput = (key: string, value: string, target: 'new' | 'edit') => {
    let parsedValue: unknown = value;
    if (!isNaN(Number(value))) {
      parsedValue = Number(value);
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else if (value === '') {
      parsedValue = null;
    }

    if (target === 'new') {
      setNewFields((prev) => ({ ...prev, [key]: parsedValue }));
    } else {
      setEditingFields((prev) => ({ ...prev, [key]: parsedValue }));
    }
  };

  const addTableField = () => {
    setNewTableFields((prev) => [...prev, { name: '', type: 'text' }]);
  };

  const removeTableField = (index: number) => {
    setNewTableFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTableField = (index: number, field: Partial<{ name: string; type: FieldType }>) => {
    setNewTableFields((prev) => 
      prev.map((f, i) => i === index ? { ...f, ...field } : f)
    );
  };

  useEffect(() => {
    if (records.length > 0) {
      const firstRecord = records[0];
      const fieldKeys = Object.keys(firstRecord.fields);
      if (fieldKeys.length > 0 && Object.keys(newFields).length === 0) {
        const defaultFields: { [key: string]: unknown } = {};
        fieldKeys.forEach((key) => {
          defaultFields[key] = '';
        });
        setNewFields(defaultFields);
        setEditingFields({});
      }
    }
  }, [records]);

  const fieldKeys = records.length > 0 ? Object.keys(records[0].fields) : [];

  const selectedTable = tables.find(t => t.table_id === tableId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">飞书多维表格管理系统</h1>
          <p className="text-gray-600">通过 API 操作飞书多维表格</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {!isAuthenticated ? (
              <div className="flex-1">
                <a
                  href={oauthUrl}
                  className="w-full block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center"
                >
                  🔐 使用飞书账号授权登录
                </a>
                <p className="text-sm text-gray-500 text-center mt-2">
                  需要授权以访问您的多维表格数据
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 mr-4">
                  <button
                    onClick={handleListApps}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                  >
                    {isLoading ? '加载中...' : '获取所有多维表格'}
                  </button>
                </div>
                {selectedApp && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">当前多维表格</label>
                    <input
                      type="text"
                      value={selectedApp.name}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}
                {selectedTable && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">当前数据表</label>
                    <input
                      type="text"
                      value={selectedTable.name}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}
                <div className="flex-1 ml-4">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {responseMessage && (
          <div className={`bg-${responseMessage.includes('成功') ? 'green' : 'red'}-50 border border-${responseMessage.includes('成功') ? 'green' : 'red'}-200 text-${responseMessage.includes('成功') ? 'green' : 'red'}-700 px-4 py-3 rounded-lg mb-6`}>
            {responseMessage}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('apps')}
              className={`flex-1 px-4 py-3 font-medium transition ${
                activeTab === 'apps'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              多维表格列表
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex-1 px-4 py-3 font-medium transition ${
                activeTab === 'tables'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              数据表管理
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 px-4 py-3 font-medium transition ${
                activeTab === 'records'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              记录管理
            </button>
          </div>

          {activeTab === 'apps' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">多维表格列表 ({apps.length} 个)</h3>
              {apps.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>暂无多维表格</p>
                  {isAuthenticated && (
                    <p className="text-sm mt-2">点击上方「获取所有多维表格」按钮获取列表</p>
                  )}
                  {!isAuthenticated && (
                    <p className="text-sm mt-2">请先进行 OAuth 授权</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apps.map((app) => (
                    <div
                      key={app.app_token}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedApp?.app_token === app.app_token
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectApp(app)}
                    >
                      <div className="font-medium text-gray-800 mb-1">{app.name}</div>
                      <div className="text-sm text-gray-500 mb-2">
                        {app.app_token}
                      </div>
                      <div className="text-xs text-gray-400">
                        创建于 {new Date(app.create_time).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="p-6">
              {!selectedApp ? (
                <div className="text-center py-12 text-gray-500">
                  <p>请先选择一个多维表格</p>
                  <button
                    onClick={() => setActiveTab('apps')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    选择多维表格
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">数据表列表 ({tables.length} 个)</h3>
                    {tables.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>暂无数据表</p>
                        <p className="text-sm mt-2">可以在右侧创建新数据表</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tables.map((table) => (
                          <div
                            key={table.table_id}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition ${
                              tableId === table.table_id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectTable(table)}
                          >
                            <div>
                              <div className="font-medium text-gray-800">{table.name}</div>
                              <div className="text-sm text-gray-500">
                                {table.fields ? `${table.fields.length} 个字段` : ''} · ID: {table.table_id}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTable(table);
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              >
                                查看记录
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTable(table.table_id, table.name);
                                }}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">创建数据表</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">数据表名称</label>
                        <input
                          type="text"
                          value={newTableName}
                          onChange={(e) => setNewTableName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="输入数据表名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">字段列表</label>
                        <div className="space-y-2">
                          {newTableFields.map((field, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateTableField(index, { name: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="字段名称"
                              />
                              <select
                                value={field.type}
                                onChange={(e) => updateTableField(index, { type: e.target.value as FieldType })}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {FIELD_TYPES.map((ft) => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </select>
                              {newTableFields.length > 1 && (
                                <button
                                  onClick={() => removeTableField(index)}
                                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={addTableField}
                          className="w-full mt-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          + 添加字段
                        </button>
                      </div>
                      <button
                        onClick={handleCreateTable}
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                      >
                        {isLoading ? '创建中...' : '创建数据表'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div className="p-6">
              {!selectedApp || !tableId ? (
                <div className="text-center py-12 text-gray-500">
                  <p>请先选择多维表格和数据表</p>
                  <button
                    onClick={() => setActiveTab('tables')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    选择数据表
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        记录列表 ({records.length} 条)
                      </h3>
                      <button
                        onClick={handleListRecords}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                      >
                        {isLoading ? '刷新中...' : '刷新列表'}
                      </button>
                    </div>
                    {records.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>暂无记录</p>
                        <p className="text-sm mt-2">可以在右侧创建新记录</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                操作
                              </th>
                              {fieldKeys.map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                                >
                                  {key}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                更新时间
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((record) => (
                              <tr
                                key={record.record_id}
                                className={`border-t hover:bg-blue-50 transition cursor-pointer ${
                                  selectedRecord?.record_id === record.record_id
                                    ? 'bg-blue-100'
                                    : ''
                                }`}
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setEditingFields({});
                                }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReadRecord(record.record_id);
                                      }}
                                      className="text-green-600 hover:text-green-700 text-sm"
                                    >
                                      查看
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRecord(record);
                                        setEditingFields({});
                                      }}
                                      className="text-blue-600 hover:text-blue-700 text-sm"
                                    >
                                      编辑
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRecord(record.record_id);
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      删除
                                    </button>
                                  </div>
                                </td>
                                {fieldKeys.map((key) => (
                                  <td
                                    key={key}
                                    className="px-4 py-3 text-sm text-gray-600"
                                  >
                                    {JSON.stringify(record.fields[key])}
                                  </td>
                                ))}
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {new Date(record.updated_time).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    {selectedRecord ? (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">编辑记录</h3>
                        <div className="space-y-4">
                          {fieldKeys.map((key) => (
                            <div key={key}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {key}
                              </label>
                              <input
                                type="text"
                                value={editingFields[key] !== undefined ? String(editingFields[key]) : String(selectedRecord.fields[key])}
                                onChange={(e) => handleFieldInput(key, e.target.value, 'edit')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                              />
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateRecord}
                              disabled={isLoading}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                            >
                              {isLoading ? '更新中...' : '更新记录'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(null);
                                setEditingFields({});
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">创建记录</h3>
                        <div className="space-y-4">
                          {fieldKeys.length === 0 ? (
                            <p className="text-gray-500 text-sm">暂无字段信息，请先选择数据表</p>
                          ) : (
                            fieldKeys.map((key) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {key}
                                </label>
                                <input
                                  type="text"
                                  value={newFields[key] !== undefined ? String(newFields[key]) : ''}
                                  onChange={(e) => handleFieldInput(key, e.target.value, 'new')}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                              </div>
                            ))
                          )}
                          <button
                            onClick={handleCreateRecord}
                            disabled={isLoading}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                          >
                            {isLoading ? '创建中...' : '创建记录'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
