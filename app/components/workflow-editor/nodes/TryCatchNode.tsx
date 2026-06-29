'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ShieldAlert, RotateCw } from 'lucide-react';

interface TryCatchNodeData {
  label?: string;
  continueOnError?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export default function TryCatchNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TryCatchNodeData;
  const hasRetry = (nodeData.maxRetries ?? 0) > 0;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 border-dashed bg-white shadow-sm transition-shadow ${
        selected ? 'border-red-400 shadow-md ring-2 ring-red-100' : 'border-red-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-red-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '异常处理'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 space-y-0.5">
        {hasRetry && (
          <div className="flex items-center gap-1 text-amber-600">
            <RotateCw className="h-3 w-3" />
            重试 {nodeData.maxRetries} 次 / {nodeData.retryDelayMs}ms
          </div>
        )}
        <div>
          {nodeData.continueOnError !== false ? '错误时继续执行降级分支' : '错误时终止工作流'}
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-red-400" />
      <Handle type="source" position={Position.Bottom} id="success" className="!bg-emerald-400" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="error" className="!bg-red-400" style={{ left: '70%' }} />
    </div>
  );
}
