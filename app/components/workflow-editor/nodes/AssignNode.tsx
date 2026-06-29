'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Pencil } from 'lucide-react';

interface AssignNodeData {
  label?: string;
  variables?: { name: string; value: string; source?: string; webhookKey?: string }[];
}

export default function AssignNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AssignNodeData;
  const vars = nodeData.variables || [];

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100' : 'border-indigo-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-indigo-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
          <Pencil className="h-4 w-4 text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '变量赋值'}</span>
      </div>
      <div className="px-3 py-2">
        {vars.length > 0 ? (
          <div className="space-y-1">
            {vars.slice(0, 3).map((v, i) => (
              <div key={i} className="rounded bg-indigo-50 px-2 py-0.5 text-xs">
                <span className="font-mono text-indigo-700">{v.name}</span>
                <span className="text-slate-400"> = </span>
                <span className="text-slate-600 truncate max-w-[80px] inline-block align-bottom">
                  {v.source === 'webhook' ? `{{${v.webhookKey || '?'}}}` : v.value || '(空)'}
                </span>
              </div>
            ))}
            {vars.length > 3 && (
              <div className="text-xs text-slate-400 text-center">+{vars.length - 3} 个变量</div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">未配置变量</span>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-indigo-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
    </div>
  );
}
