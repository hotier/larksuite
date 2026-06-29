/**
 * Filter 节点 - 条件筛选
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Filter } from 'lucide-react';

interface FilterNodeData {
  label?: string;
  conditions?: unknown[];
  matchMode?: string;
}

export default function FilterNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FilterNodeData;
  const conditionCount = (nodeData.conditions as unknown[])?.length || 0;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-slate-200'
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl drag-handle cursor-grab">
        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
          <Filter className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{nodeData.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500">
          {conditionCount > 0 ? (
            <span>{conditionCount} 个条件 · {nodeData.matchMode === 'all' ? 'AND' : 'OR'}</span>
          ) : (
            <span className="text-amber-500">未配置条件</span>
          )}
        </div>
      </div>
      {/* 两个输出：通过 / 不通过 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="pass"
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-white"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fail"
        className="!w-2.5 !h-2.5 !bg-red-400 !border-2 !border-white"
        style={{ left: '70%' }}
      />
    </div>
  );
}
