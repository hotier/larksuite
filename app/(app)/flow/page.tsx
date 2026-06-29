'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Trash2, ArrowRight, Clock, Layers, Search } from 'lucide-react';
import type { Workflow } from '@/types';
import { idGen } from '@/lib/workflow-engine/editor-store';
import Toast from '@/app/components/Toast';
import ConfirmDialog from '@/app/components/ConfirmDialog';

const STORAGE_KEY = 'bitable_workflows';

function loadWorkflowsFromStorage(): Workflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWorkflowsToStorage(workflows: Workflow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export default function FlowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; type: 'info' | 'success' | 'error'; text: string }[]>([]);

  const addToast = useCallback((type: 'info' | 'success' | 'error', text: string) => {
    const tid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id: tid, type, text }]);
  }, []);

  const dismissToast = useCallback((tid: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== tid));
  }, []);

  // 加载工作流
  useEffect(() => {
    const local = loadWorkflowsFromStorage();
    if (local.length > 0) {
      setWorkflows(local);
      setIsLoading(false);
    }

    // 从服务端同步
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data) => {
        const serverList = (data.workflows as Workflow[]) || [];
        if (serverList.length > 0) {
          setWorkflows(serverList);
          saveWorkflowsToStorage(serverList);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // 新建工作流
  const handleCreate = useCallback(() => {
    const id = idGen();
    const now = new Date().toISOString();
    const newWf: Workflow = { id, name: '未命名工作流', nodes: [], status: 'draft', createdAt: now, updatedAt: now };

    const updated = [newWf, ...workflows];
    setWorkflows(updated);
    saveWorkflowsToStorage(updated);

    // 同步到服务端
    fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflows: updated }),
    }).catch(() => {});

    router.push(`/flow/${id}`);
  }, [workflows, router]);

  // 删除工作流（触发确认弹窗）
  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }, []);

  const confirmDeleteWorkflow = useCallback(() => {
    if (!deleteConfirmId) return;
    const updated = workflows.filter((w) => w.id !== deleteConfirmId);
    setWorkflows(updated);
    saveWorkflowsToStorage(updated);

    fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflows: updated }),
    }).catch(() => {});

    setDeleteConfirmId(null);
    addToast('success', '工作流已删除');
  }, [deleteConfirmId, workflows, addToast]);

  const cancelDeleteWorkflow = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  // 过滤
  const filtered = search
    ? workflows.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    : workflows;

  // 时间格式化
  const fmtDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return s; }
  };

  const statusLabel = (s: Workflow['status']) =>
    s === 'enabled' ? '已启用' : s === 'disabled' ? '已禁用' : '草稿';

  const statusColor = (s: Workflow['status']) =>
    s === 'enabled' ? 'bg-emerald-100 text-emerald-700' :
    s === 'disabled' ? 'bg-red-100 text-red-700' :
    'bg-neutral-100 text-neutral-500';

  return (
    <div className="flex flex-col h-full">
      <Toast messages={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              <Bot className="w-4 h-4" />
            </span>
            <h1 className="text-sm font-semibold text-neutral-900">机器人指令</h1>
          </div>
          <span className="text-xs text-neutral-400">Webhook 自动化工作流</span>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors bg-violet-500 hover:bg-violet-600"
        >
          <Plus className="w-3.5 h-3.5" />
          新建工作流
        </button>
      </header>

      {/* Search bar */}
      <div className="px-6 py-3 flex-shrink-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工作流..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <Bot className="w-12 h-12 mb-3 text-neutral-200" />
            {workflows.length === 0 ? (
              <>
                <p className="text-sm font-medium">暂无工作流</p>
                <p className="text-xs mt-1">点击"新建工作流"创建第一个自动化流程</p>
              </>
            ) : (
              <p className="text-sm">没有匹配的工作流</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((wf) => (
              <div
                key={wf.id}
                onClick={() => router.push(`/flow/${wf.id}`)}
                className="group relative rounded-xl border border-neutral-200 bg-white p-4 cursor-pointer hover:shadow-md hover:border-neutral-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">{wf.name}</h3>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(wf.status)}`}>
                    {statusLabel(wf.status)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {wf.nodes.length} 节点
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {fmtDate(wf.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 truncate flex-1 mr-2">
                    创建于 {fmtDate(wf.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(wf.id, e)}
                      className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="删除工作流"
        message={<>确定要删除工作流 <span className="font-semibold text-neutral-800">「{workflows.find((w) => w.id === deleteConfirmId)?.name}」</span> 吗？此操作不可恢复。</>}
        confirmLabel="删除"
        onConfirm={confirmDeleteWorkflow}
        onCancel={cancelDeleteWorkflow}
      />
    </div>
  );
}
