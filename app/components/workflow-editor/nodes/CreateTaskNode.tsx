'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckSquare, Flag } from 'lucide-react';

interface CreateTaskNodeData {
  label?: string;
  title?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-blue-50 text-blue-600',
  medium: 'bg-yellow-50 text-yellow-600',
  high: 'bg-red-50 text-red-600',
};

export default function CreateTaskNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CreateTaskNodeData;
  const priority = nodeData.priority || 'medium';

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-yellow-400 shadow-md ring-2 ring-yellow-100' : 'border-yellow-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-yellow-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-50">
          <CheckSquare className="h-4 w-4 text-yellow-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '创建任务'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 space-y-0.5">
        {nodeData.title && <div className="truncate text-slate-700 font-medium">{nodeData.title}</div>}
        <div className="flex items-center gap-2">
          {nodeData.assignee && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5">@{nodeData.assignee}</span>
          )}
          <span className={`rounded px-1.5 py-0.5 ${PRIORITY_CLASSES[priority] || ''}`}>
            <Flag className="inline h-3 w-3 mr-0.5" />
            {{ low: '低', medium: '中', high: '高' }[priority]}
          </span>
        </div>
        {nodeData.dueDate && <div>截止: {nodeData.dueDate}</div>}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400" />
    </div>
  );
}
