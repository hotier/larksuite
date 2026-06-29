'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface SwitchNodeData {
  label?: string;
  branches?: { label: string }[];
  hasDefault?: boolean;
}

export default function SwitchNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SwitchNodeData;
  const branchCount = nodeData.branches?.length ?? 0;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-sky-400 shadow-md ring-2 ring-sky-100' : 'border-sky-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-sky-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
          <GitBranch className="h-4 w-4 text-sky-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '多路分支'}</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {branchCount > 0 ? (
            <>
              {nodeData.branches!.slice(0, 3).map((b, i) => (
                <span key={i} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                  {b.label || `分支 ${i + 1}`}
                </span>
              ))}
              {branchCount > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  +{branchCount - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400">未配置分支规则</span>
          )}
        </div>
        {nodeData.hasDefault !== false && (
          <div className="mt-1 rounded bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
            默认分支已启用
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-sky-400" />
      <Handle type="source" position={Position.Bottom} id="pass" className="!bg-sky-400" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="fail" className="!bg-red-400" style={{ left: '70%' }} />
    </div>
  );
}
