'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Combine } from 'lucide-react';

interface MergeNodeData {
  label?: string;
  mode?: string;
  joinKey?: string;
  inputCount?: number;
}

const MODE_LABELS: Record<string, string> = {
  append: '追加合并',
  combine: '对象合并',
  join: 'Key 关联',
};

export default function MergeNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as MergeNodeData;
  const mode = nodeData.mode || 'append';
  const inputCount = nodeData.inputCount ?? 2;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-teal-400 shadow-md ring-2 ring-teal-100' : 'border-teal-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-teal-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
          <Combine className="h-4 w-4 text-teal-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '合并节点'}</span>
      </div>
      <div className="px-3 py-2">
        <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
          {MODE_LABELS[mode] || mode}
        </span>
        <span className="ml-1 text-xs text-slate-400">{inputCount} 路输入</span>
        {mode === 'join' && nodeData.joinKey && (
          <div className="mt-1 text-xs text-slate-400">join key: {nodeData.joinKey}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} id="input_a" className="!bg-teal-400" style={{ left: '30%' }} />
      <Handle type="target" position={Position.Top} id="input_b" className="!bg-teal-400" style={{ left: '70%' }} />
      <Handle type="source" position={Position.Bottom} className="!bg-teal-400" />
    </div>
  );
}
