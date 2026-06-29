'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bell } from 'lucide-react';

interface BotNotifyNodeData {
  label?: string;
  channel?: string;
  title?: string;
  level?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  feishu: '飞书',
  slack: 'Slack',
  dingtalk: '钉钉',
  wechat_work: '企微',
};

const LEVEL_CLASSES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  success: 'bg-emerald-50 text-emerald-700',
};

export default function BotNotifyNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BotNotifyNodeData;
  const channel = nodeData.channel || 'feishu';

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-fuchsia-400 shadow-md ring-2 ring-fuchsia-100' : 'border-fuchsia-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-fuchsia-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-50">
          <Bell className="h-4 w-4 text-fuchsia-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || 'Bot 通知'}</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-fuchsia-50 px-2 py-0.5 text-xs text-fuchsia-700">
            {CHANNEL_LABELS[channel] || channel}
          </span>
          {nodeData.level && (
            <span className={`rounded px-2 py-0.5 text-xs ${LEVEL_CLASSES[nodeData.level] || ''}`}>
              {nodeData.level}
            </span>
          )}
        </div>
        {nodeData.title && (
          <div className="mt-1 text-xs text-slate-500 truncate">{nodeData.title}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-fuchsia-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-fuchsia-400" />
    </div>
  );
}
