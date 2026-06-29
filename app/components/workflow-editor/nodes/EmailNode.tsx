'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Mail } from 'lucide-react';

interface EmailNodeData {
  label?: string;
  to?: string;
  subject?: string;
  bodyFormat?: string;
  includeSummary?: boolean;
}

export default function EmailNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EmailNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-rose-400 shadow-md ring-2 ring-rose-100' : 'border-rose-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-rose-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
          <Mail className="h-4 w-4 text-rose-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '发送邮件'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 space-y-0.5">
        {nodeData.to && <div>收件人: <span className="text-slate-700">{nodeData.to}</span></div>}
        {nodeData.subject && (
          <div className="truncate">主题: <span className="text-slate-700">{nodeData.subject}</span></div>
        )}
        <div className="flex gap-1">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{nodeData.bodyFormat === 'html' ? 'HTML' : '纯文本'}</span>
          {nodeData.includeSummary && (
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600">含摘要</span>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-rose-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-rose-400" />
    </div>
  );
}
