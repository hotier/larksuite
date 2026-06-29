/**
 * Action 节点 - 多维表格 CRUD 操作
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { FieldMapping } from '@/types';

interface ActionNodeData {
  label: string;
  actionType: string;
  targetTableName?: string;
  fieldMappings?: FieldMapping[];
}

const ACTION_META: Record<string, { icon: React.FC<{ className?: string }>; color: string; bg: string; border: string; label: string }> = {
  create_record: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '新增记录' },
  read_records: { icon: Search, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: '查询记录' },
  update_record: { icon: Pencil, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '更新记录' },
  delete_record: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: '删除记录' },
};

export default function ActionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ActionNodeData;
  const actionType = nodeData.actionType || 'create_record';
  const meta = ACTION_META[actionType] || ACTION_META.create_record;
  const Icon = meta.icon;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : meta.border
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b rounded-t-xl drag-handle cursor-grab ${meta.bg} ${meta.border}`}>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${meta.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        </div>
        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500 space-y-0.5">
          {nodeData.targetTableName ? (
            <div className="truncate">表: {nodeData.targetTableName}</div>
          ) : (
            <div className="text-amber-500">请配置数据表</div>
          )}
          {nodeData.fieldMappings && nodeData.fieldMappings.length > 0 && (
            <div>{nodeData.fieldMappings.length} 个字段映射</div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
}
