'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Table2, ClipboardList, FileText, Tag, FileCode, ChevronRight } from 'lucide-react';
import type { App, Table, Field, FieldType, BitableRecord, ToastMessage } from '@/types';
import {
  refreshApps, invalidateAppsCache, createApp,
  listTables, createTable, deleteTable, listFields,
  listRecords, createRecord, deleteApiRecord,
} from '@/lib/api';
import OAuthLogin from '@/app/components/OAuthLogin';
import AppGrid from '@/app/components/AppGrid';
import TableManager from '@/app/components/TableManager';
import RecordManager from '@/app/components/RecordManager';
import FieldSelector from '@/app/components/FieldSelector';
import Toast from '@/app/components/Toast';

type View = 'apps' | 'tables' | 'records';

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [tableFields, setTableFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [records, setRecords] = useState<BitableRecord[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [view, setView] = useState<View>('apps');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 翻页状态
  const [pageTokens, setPageTokens] = useState<string[]>(['']);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const addToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('feishu_user_token');
    const storedExpire = localStorage.getItem('feishu_token_expire');
    let valid = false;
    if (storedToken && storedExpire) {
      const storedVal = parseInt(storedExpire);
      const expireTime = storedVal > 10_000_000_000 ? storedVal : Date.now() + storedVal * 1000;
      if (Date.now() < expireTime) { setIsAuthenticated(true); valid = true; }
      else { localStorage.removeItem('feishu_user_token'); localStorage.removeItem('feishu_token_expire'); }
    }
    if (!valid) window.location.replace('/');
  }, []);

  const withLoading = async (fn: () => Promise<void>, successMsg?: string, errorPrefix = '操作失败') => {
    setIsLoading(true);
    try { await fn(); if (successMsg) addToast('success', successMsg); }
    catch (error) { addToast('error', `${errorPrefix}: ${error instanceof Error ? error.message : '未知错误'}`); }
    finally { setIsLoading(false); }
  };

  const resetPagination = useCallback(() => {
    setPageTokens(['']); setCurrentPage(1); setHasMore(false); setTotal(0);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('feishu_user_token');
    localStorage.removeItem('feishu_token_expire');
    invalidateAppsCache();
    setIsAuthenticated(false);
    setApps([]); setSelectedApp(null); setTables([]); setSelectedTableId('');
    setTableFields([]); setSelectedFieldId(''); setRecords([]); setRecordsLoaded(false);
    setView('apps');
    resetPagination();
  };

  const handleListApps = useCallback(() => {
    withLoading(async () => {
      const { data } = await refreshApps();
      setApps(data.files || []);
    }, undefined, '获取多维表格列表失败');
  }, []);

  const handleCreateApp = useCallback(async (name: string, folderToken?: string) => {
    setIsCreating(true);
    try { const app = await createApp(name, folderToken); setApps((prev) => [app, ...prev]); addToast('success', `多维表格 "${name}" 创建成功`); }
    catch (error) { const msg = error instanceof Error ? error.message : '未知错误'; addToast('error', `创建多维表格失败: ${msg}`); throw error; }
    finally { setIsCreating(false); }
  }, []);

  const handleSelectApp = useCallback((app: App) => {
    setSelectedApp(app); setView('tables');
    setSelectedTableId(''); setSelectedFieldId(''); setRecords([]); setRecordsLoaded(false);
    resetPagination();
    // 自动加载该 App 下的数据表列表
    withLoading(async () => {
      const data = await listTables(app.app_token);
      setTables(data.items || []);
    }, undefined, '获取数据表列表失败');
  }, [resetPagination]);

  const handleListTables = useCallback(() => {
    if (!selectedApp) return;
    withLoading(async () => {
      const data = await listTables(selectedApp.app_token);
      setTables(data.items || []);
    }, undefined, '获取数据表列表失败');
  }, [selectedApp]);

  const handleCreateTable = useCallback(async (name: string, fields: { name: string; type: FieldType }[]) => {
    if (!selectedApp) return;
    await withLoading(async () => {
      await createTable(selectedApp.app_token, name, fields);
      const data = await listTables(selectedApp.app_token);
      setTables(data.items || []);
    }, `数据表 "${name}" 创建成功`, '创建数据表失败');
  }, [selectedApp]);

  const handleDeleteTable = useCallback((tableId: string, tableName: string) => {
    if (!selectedApp) return;
    withLoading(async () => {
      await deleteTable(selectedApp.app_token, tableId);
      if (tableId === selectedTableId) setSelectedTableId('');
      const data = await listTables(selectedApp.app_token);
      setTables(data.items || []);
    }, `数据表 "${tableName}" 已删除`, '删除数据表失败');
  }, [selectedApp, selectedTableId]);

  const handleSelectTable = useCallback((table: Table) => {
    setSelectedTableId(table.table_id);
    setSelectedFieldId(''); setRecords([]); setRecordsLoaded(false); setView('records');
    resetPagination();
    // 自动加载该数据表的字段和记录
    if (selectedApp) {
      withLoading(async () => {
        const token = pageTokens[0] || '';
        const [fieldsData, recordsData] = await Promise.all([
          listFields(selectedApp.app_token, table.table_id),
          listRecords(selectedApp.app_token, table.table_id, PAGE_SIZE, token),
        ]);
        setTableFields(fieldsData);
        setRecords(recordsData.records || []);
        setTotal(recordsData.total || recordsData.records.length);
        setHasMore(recordsData.has_more || false);
        if (recordsData.has_more && recordsData.page_token) {
          setPageTokens((prev) => { const n = [...prev]; n[1] = recordsData.page_token; return n; });
        }
        setRecordsLoaded(true);
      }, undefined, '获取字段/记录失败');
    }
  }, [selectedApp, pageTokens, resetPagination]);

  const handleSelectorSelectApp = useCallback(async (app: App) => {
    setSelectedApp(app); setTables([]); setTableFields([]);
    setSelectedTableId(''); setSelectedFieldId('');
    setLoadingTables(true);
    try { const data = await listTables(app.app_token); setTables(data.items || []); }
    catch (err) { addToast('error', `加载数据表失败: ${err instanceof Error ? err.message : '未知错误'}`); }
    finally { setLoadingTables(false); }
  }, []);

  const handleSelectorSelectTable = useCallback(async (table: Table) => {
    setSelectedTableId(table.table_id); setSelectedFieldId(''); setTableFields([]);
    if (selectedApp) {
      setLoadingFields(true);
      try { const fields = await listFields(selectedApp.app_token, table.table_id); setTableFields(fields); }
      catch (err) { addToast('error', `加载字段失败: ${err instanceof Error ? err.message : '未知错误'}`); }
      finally { setLoadingFields(false); }
    }
  }, [selectedApp]);

  const handleSelectorSelectField = useCallback((field: Field) => { setSelectedFieldId(field.field_id); }, []);

  const handleListRecords = useCallback(() => {
    if (!selectedApp || !selectedTableId) return;
    withLoading(async () => {
      const token = pageTokens[currentPage - 1] ?? '';
      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setTotal(recordsData.total || recordsData.records.length);
      setHasMore(recordsData.has_more || false);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[currentPage] = recordsData.page_token; return n; });
      }
      setRecordsLoaded(true);
    }, undefined, '刷新记录失败');
  }, [selectedApp, selectedTableId, currentPage, pageTokens]);

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (!selectedApp || !selectedTableId) return;
    await withLoading(async () => {
      await deleteApiRecord(selectedApp.app_token, selectedTableId, recordId);
      const token = pageTokens[currentPage - 1] ?? '';
      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setTotal(recordsData.total || recordsData.records.length);
      setHasMore(recordsData.has_more || false);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[currentPage] = recordsData.page_token; return n; });
      }
    }, '记录已删除', '删除记录失败');
  }, [selectedApp, selectedTableId, currentPage, pageTokens]);

  const handleCreateRecord = useCallback(async (fields: Record<string, unknown>) => {
    if (!selectedApp || !selectedTableId) return;
    await withLoading(async () => {
      const namedFields: Record<string, unknown> = {};
      for (const [fieldId, value] of Object.entries(fields)) {
        const fieldMeta = tableFields.find((f) => f.field_id === fieldId);
        namedFields[fieldMeta?.name || fieldId] = value;
      }
      await createRecord(selectedApp.app_token, selectedTableId, namedFields);
      const token = pageTokens[currentPage - 1] ?? '';
      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setTotal(recordsData.total || recordsData.records.length);
      setHasMore(recordsData.has_more || false);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[currentPage] = recordsData.page_token; return n; });
      }
    }, '记录创建成功', '创建记录失败');
  }, [selectedApp, selectedTableId, tableFields, currentPage, pageTokens]);

  // 翻页：上一页
  const handlePrevPage = useCallback(() => {
    if (!selectedApp || !selectedTableId || currentPage <= 1) return;
    const prevPage = currentPage - 1;
    withLoading(async () => {
      const token = pageTokens[prevPage - 1] ?? '';
      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setHasMore(!!pageTokens[prevPage + 1] || recordsData.has_more);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[prevPage] = recordsData.page_token; return n; });
      }
      setCurrentPage(prevPage);
    }, undefined, '翻页失败');
  }, [selectedApp, selectedTableId, currentPage, pageTokens]);

  // 翻页：下一页
  const handleNextPage = useCallback(() => {
    if (!selectedApp || !selectedTableId || !hasMore) return;
    const nextPage = currentPage + 1;
    withLoading(async () => {
      const token = pageTokens[nextPage - 1] ?? pageTokens[currentPage - 1] ?? '';
      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setTotal(recordsData.total || recordsData.records.length);
      setHasMore(recordsData.has_more || false);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[nextPage] = recordsData.page_token; return n; });
      }
      setCurrentPage(nextPage);
    }, undefined, '翻页失败');
  }, [selectedApp, selectedTableId, currentPage, hasMore, pageTokens]);

  // 翻页：跳转到指定页码
  const handleGoToPage = useCallback(async (targetPage: number) => {
    if (!selectedApp || !selectedTableId || targetPage === currentPage) return;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (targetPage < 1 || targetPage > totalPages) return;

    await withLoading(async () => {
      let token = '';

      if (targetPage > currentPage) {
        // 向前翻：尽可能利用已缓存的 token，必要时逐步获取
        token = pageTokens[currentPage - 1] ?? '';
        for (let p = currentPage; p < targetPage; p++) {
          const cachedToken = pageTokens[p - 1];
          if (cachedToken !== undefined) token = cachedToken;
          if (p < targetPage - 1) {
            const res = await listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token);
            token = res.page_token || '';
            if (!res.has_more) break;
          }
        }
      } else {
        // 向后翻：cursor 分页不支持回退，从第 1 页重新链式获取
        token = pageTokens[0] ?? '';
        for (let p = 1; p < targetPage; p++) {
          const res = await listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token);
          token = res.page_token || '';
          if (!res.has_more) break;
        }
      }

      const [fieldsData, recordsData] = await Promise.all([
        listFields(selectedApp.app_token, selectedTableId),
        listRecords(selectedApp.app_token, selectedTableId, PAGE_SIZE, token),
      ]);
      setTableFields(fieldsData);
      setRecords(recordsData.records || []);
      setTotal(recordsData.total || recordsData.records.length);
      setHasMore(recordsData.has_more || false);
      if (recordsData.has_more && recordsData.page_token) {
        setPageTokens((prev) => { const n = [...prev]; n[targetPage] = recordsData.page_token; return n; });
      }
      setCurrentPage(targetPage);
    }, undefined, '翻页失败');
  }, [selectedApp, selectedTableId, currentPage, total, pageTokens, withLoading]);

  useEffect(() => { if (isAuthenticated && apps.length === 0) handleListApps(); }, [isAuthenticated]);

  const selectedTable = tables.find((t) => t.table_id === selectedTableId);

  const STATS = [
    { label: '多维表格', value: apps.length, icon: Table2 },
    { label: '数据表', value: tables.length, icon: ClipboardList },
    ...(view === 'records' ? [
      { label: '记录', value: total, icon: FileText },
      { label: '字段', value: tableFields.length, icon: Tag },
    ] : []),
  ];

  const TABS = [
    { key: 'apps' as View, label: '表格列表', icon: Table2 },
    { key: 'tables' as View, label: '数据表', icon: ClipboardList },
    { key: 'records' as View, label: '记录', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full">
      <Toast messages={toasts} onDismiss={dismissToast} />

      {/* Top Bar */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <button
            onClick={() => { setView('apps'); setSelectedApp(null); setTables([]); setSelectedTableId(''); setSelectedFieldId(''); setRecords([]); setRecordsLoaded(false); resetPagination(); }}
            className="font-medium transition-colors"
            style={{ color: view === 'apps' ? 'var(--text)' : 'var(--text-tertiary)' }}
          >
            所有表格
          </button>
          {selectedApp && (
            <>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
              <button
                onClick={() => { setView('tables'); setSelectedTableId(''); setSelectedFieldId(''); setRecords([]); setRecordsLoaded(false); }}
                className="font-medium transition-colors truncate max-w-[200px]"
                style={{ color: view === 'tables' ? 'var(--text)' : 'var(--text-tertiary)' }}
              >
                {selectedApp.name}
              </button>
            </>
          )}
          {selectedTable && (
            <>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
              <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
                {selectedTable.name}
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/flow"
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <FileCode className="w-4 h-4" />
            机器人指令
          </Link>
          <OAuthLogin
            isAuthenticated={isAuthenticated} oauthUrl="" isLoading={isLoading}
            onFetchApps={handleListApps} onLogout={handleLogout} hideLogin
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          {STATS.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold tabular-nums text-neutral-900">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Field Selector */}
          {isAuthenticated && (
            <div
              className="p-4 rounded-lg animate-fade-in"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide flex-shrink-0">
                  快速导航
                </span>
                <div className="flex-1">
                  <FieldSelector
                    apps={apps} tables={tables} tableFields={tableFields}
                    selectedApp={selectedApp} selectedTableId={selectedTableId} selectedFieldId={selectedFieldId}
                    loadingTables={loadingTables} loadingFields={loadingFields}
                    onSelectApp={handleSelectorSelectApp}
                    onSelectTable={handleSelectorSelectTable}
                    onSelectField={handleSelectorSelectField}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabs + Content */}
          <div
            className="rounded-lg overflow-hidden animate-fade-in"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Tab bar */}
            <div
              className="flex border-b px-2"
              style={{ borderColor: 'var(--border)' }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative"
                  style={{
                    color: view === tab.key ? 'var(--text)' : 'var(--text-tertiary)',
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {view === tab.key && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {view === 'apps' && (
                <AppGrid
                  apps={apps} selectedApp={selectedApp}
                  isAuthenticated={isAuthenticated} isCreating={isCreating}
                  onSelectApp={handleSelectApp} onCreateApp={handleCreateApp}
                />
              )}
              {view === 'tables' && (
                <TableManager
                  selectedApp={selectedApp} tables={tables} selectedTableId={selectedTableId}
                  isLoading={isLoading} onSelectTable={handleSelectTable}
                  onDeleteTable={handleDeleteTable} onCreateTable={handleCreateTable}
                  onSwitchToApps={() => setView('apps')}
                />
              )}
              {view === 'records' && (
                <RecordManager
                  appToken={selectedApp?.app_token ?? ''} tableId={selectedTableId}
                  fields={tableFields} records={records} isLoading={isLoading}
                  onSwitchToTables={() => setView('tables')}
                  onCreateRecord={handleCreateRecord} onDeleteRecord={handleDeleteRecord}
                  onRefreshRecords={handleListRecords}
                  currentPage={currentPage} hasMore={hasMore} total={total} pageSize={PAGE_SIZE}
                  onNextPage={handleNextPage} onPrevPage={handlePrevPage} onGoToPage={handleGoToPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
