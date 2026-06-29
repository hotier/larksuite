/**
 * 右侧统一面板 — 节点列表（默认）与节点配置表单（选中节点时）共用一个容器。
 *
 * - 默认无选中：显示可拖拽的节点列表（按分类折叠/展开）
 * - 选中节点：显示该节点的配置表单，顶部有返回按钮切回列表
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Zap, GitBranch, Shuffle, Play, Bell, Building2,
  ChevronDown, ChevronRight, ArrowLeft, X,
} from 'lucide-react';
import { useWorkflowEditorStore } from '@/lib/workflow-engine/editor-store';
import { nodeRegistry } from '@/lib/workflow-engine/node-registry';
import { NODE_CATEGORIES } from '@/types';
import type { Field } from '@/types';
import { configPanelRegistry } from './ConfigPanel';

// ====== 分类图标 ======

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  trigger: Zap,
  flow_control: GitBranch,
  data_transform: Shuffle,
  action: Play,
  notification: Bell,
  lark_ecosystem: Building2,
};

// ====== Props ======

interface RightPanelProps {
  onListTables?: (appToken: string) => Promise<{ table_id: string; name: string }[]>;
  onListFields?: (appToken: string, tableId: string) => Promise<Field[]>;
}

// ====== 主组件 ======

export default function RightPanel({ onListTables, onListFields }: RightPanelProps) {
  const selectedNodeId = useWorkflowEditorStore((s) => s.selectedNodeId);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const setSelectedNodeId = useWorkflowEditorStore((s) => s.setSelectedNodeId);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
    >
      {selectedNode ? (
        <ConfigView
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onListTables={onListTables}
          onListFields={onListFields}
        />
      ) : (
        <NodeListView />
      )}
    </div>
  );
}

// ====== 节点列表视图 ======

function NodeListView() {
  const grouped = useMemo(() => nodeRegistry.getAddableItemsByCategory(), []);

  const sortedCategories = useMemo(() => {
    return [...grouped.keys()].sort((a, b) => {
      const metaA = NODE_CATEGORIES.find((c) => c.id === a);
      const metaB = NODE_CATEGORIES.find((c) => c.id === b);
      return (metaA?.order ?? 99) - (metaB?.order ?? 99);
    });
  }, [grouped]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, kind: string, actionType?: string) => {
    e.dataTransfer.setData('application/reactflow-type', kind);
    if (actionType) {
      e.dataTransfer.setData('application/reactflow-action-type', actionType);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">节点列表</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedCategories.map((cat) => {
          const items = grouped.get(cat);
          if (!items || items.length === 0) return null;

          const meta = NODE_CATEGORIES.find((c) => c.id === cat);
          const CatIcon = CATEGORY_ICONS[cat] || Zap;
          const isCollapsed = collapsed.has(cat);

          return (
            <div key={cat}>
              {/* 分类标题 */}
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors sticky top-0"
                style={{ background: 'var(--bg)' }}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                )}
                <CatIcon className="w-3 h-3 flex-shrink-0 opacity-60" />
                <span className="flex-1 text-left">{meta?.label || cat}</span>
                <span className="text-[10px] text-neutral-300">{items.length}</span>
              </button>

              {/* 节点列表 */}
              {!isCollapsed && (
                <div className="px-2 pb-1 space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const key = item.actionType ? `${item.kind}:${item.actionType}` : item.kind;
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.kind, item.actionType)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${item.bg} ${item.border}`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                          <Icon className={`w-3 h-3 ${item.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-[11px] font-medium ${item.color}`}>{item.displayName}</div>
                          <div className="text-[10px] text-neutral-400 truncate leading-tight">{item.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          拖拽节点到画布中，连线定义执行顺序
        </p>
      </div>
    </>
  );
}

// ====== 节点配置视图 ======

function ConfigView({
  node,
  onClose,
  onListTables,
  onListFields,
}: {
  node: NonNullable<ReturnType<typeof useWorkflowEditorStore.getState>['nodes'][number]>;
  onClose: () => void;
  onListTables?: (appToken: string) => Promise<{ table_id: string; name: string }[]>;
  onListFields?: (appToken: string, tableId: string) => Promise<Field[]>;
}) {
  const rfType = node.type as string;
  const ConfigComp = configPanelRegistry.get(rfType);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-neutral-100 transition-colors flex-shrink-0"
          title="返回节点列表"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
        </button>
        <span className="text-xs font-semibold text-neutral-800 flex-1 truncate">
          {(node.data as Record<string, unknown>).label as string || '节点配置'}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-neutral-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {ConfigComp ? (
          <ConfigComp
            node={node}
            onClose={onClose}
            onListTables={onListTables}
            onListFields={onListFields}
          />
        ) : (
          <div className="text-xs text-neutral-400">该节点无需配置</div>
        )}
      </div>
    </>
  );
}
