/**
 * 节点侧边栏 - 按分类分组展示，支持折叠/展开
 *
 * 通过 NodeRegistry 获取按分类分组的可添加节点。
 * 添加新插件后自动出现在对应分类下。
 */

'use client';

import React, { useMemo, useState } from 'react';
import {
  Zap, GitBranch, Shuffle, Play, Bell, Building2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { nodeRegistry } from '@/lib/workflow-engine/node-registry';
import { NODE_CATEGORIES } from '@/types';

interface NodePanelProps {
  className?: string;
}

/** 分类图标映射 */
const CATEGORY_ICONS: Record<string, typeof Zap> = {
  trigger: Zap,
  flow_control: GitBranch,
  data_transform: Shuffle,
  action: Play,
  notification: Bell,
  lark_ecosystem: Building2,
};

export default function NodePanel({ className = '' }: NodePanelProps) {
  const grouped = useMemo(() => nodeRegistry.getAddableItemsByCategory(), []);

  // 按 order 排序的分类列表
  const sortedCategories = useMemo(() => {
    return [...grouped.keys()].sort((a, b) => {
      const metaA = NODE_CATEGORIES.find((c) => c.id === a);
      const metaB = NODE_CATEGORIES.find((c) => c.id === b);
      return (metaA?.order ?? 99) - (metaB?.order ?? 99);
    });
  }, [grouped]);

  // 默认全部展开
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
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ background: 'var(--bg)', borderRight: '1px solid var(--border)' }}
    >
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">节点</h3>
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
    </div>
  );
}
