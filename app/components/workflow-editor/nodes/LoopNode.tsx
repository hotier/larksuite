'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Repeat } from 'lucide-react';

interface LoopNodeData {
  label?: string;
  mode?: string;
  count?: number;
  iterateSource?: string;
  maxIterations?: number;
}

const MODE_LABELS: Record<string, string> = {
  fixed_count: '固定次数',
  iterate_array: '迭代数组',
  while_condition: '条件循环',
};

export default function LoopNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as LoopNodeData;
  const mode = nodeData.mode || 'fixed_count';
  const modeLabel = MODE_LABELS[mode] || mode;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-pink-400 shadow-md ring-2 ring-pink-100' : 'border-pink-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-pink-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50">
          <Repeat className="h-4 w-4 text-pink-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '循环迭代'}</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">
            {modeLabel}
          </span>
          {mode === 'fixed_count' && nodeData.count && (
            <span className="text-xs text-slate-500">× {nodeData.count} 次</span>
          )}
          {mode === 'iterate_array' && nodeData.iterateSource && (
            <span className="text-xs text-slate-500 truncate max-w-[80px]">{nodeData.iterateSource}</span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          上限 {nodeData.maxIterations || 100} 次
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-pink-400" />
      <Handle type="source" position={Position.Bottom} id="item" className="!bg-pink-400" style={{ left: '40%' }} />
      <Handle type="source" position={Position.Bottom} id="done" className="!bg-emerald-400" style={{ left: '60%' }} />
    </div>
  );
}
