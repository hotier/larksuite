'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Calendar, Bell } from 'lucide-react';

interface CalendarEventNodeData {
  label?: string;
  title?: string;
  startTime?: string;
  needReminder?: boolean;
}

export default function CalendarEventNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CalendarEventNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-green-400 shadow-md ring-2 ring-green-100' : 'border-green-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-green-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
          <Calendar className="h-4 w-4 text-green-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '日历事件'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-slate-500 space-y-0.5">
        {nodeData.title && (
          <div className="truncate text-slate-700 font-medium">{nodeData.title}</div>
        )}
        {nodeData.startTime && (
          <div>开始: {nodeData.startTime}</div>
        )}
        {nodeData.needReminder !== false && (
          <div className="flex items-center gap-1 text-green-600">
            <Bell className="h-3 w-3" /> 提醒已启用
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  );
}
