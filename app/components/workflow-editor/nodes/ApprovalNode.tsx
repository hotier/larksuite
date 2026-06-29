'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileCheck, Clock } from 'lucide-react';

interface ApprovalNodeData {
  label?: string;
  title?: string;
  approvalCode?: string;
  waitForResult?: boolean;
}

export default function ApprovalNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ApprovalNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-orange-400 shadow-md ring-2 ring-orange-100' : 'border-orange-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-orange-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
          <FileCheck className="h-4 w-4 text-orange-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '发起审批'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 space-y-0.5">
        {nodeData.title && (
          <div className="truncate text-slate-700 font-medium">{nodeData.title}</div>
        )}
        {nodeData.approvalCode && (
          <div>审批码: {nodeData.approvalCode}</div>
        )}
        <div className="flex items-center gap-1">
          {nodeData.waitForResult !== false ? (
            <span className="flex items-center gap-0.5 text-amber-600">
              <Clock className="h-3 w-3" /> 等待审批结果
            </span>
          ) : (
            <span className="text-slate-400">不等待, 继续执行</span>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-orange-400" />
      <Handle type="source" position={Position.Bottom} id="approved" className="!bg-emerald-400" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="rejected" className="!bg-red-400" style={{ left: '70%' }} />
    </div>
  );
}
