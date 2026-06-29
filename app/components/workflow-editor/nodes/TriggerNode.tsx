/**
 * 触发器节点 - Webhook / 定时 / 多维表格事件
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Webhook, Clock, Database } from 'lucide-react';

interface TriggerNodeData {
  label?: string;
  triggerKind?: string;
  webhookUrl?: string;
}

const TRIGGER_ICONS: Record<string, React.FC<{ className?: string }>> = {
  webhook: Webhook,
  scheduled: Clock,
  bitable_event: Database,
};

export default function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TriggerNodeData;
  const kind = nodeData.triggerKind || 'webhook';
  const Icon = TRIGGER_ICONS[kind] || Webhook;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-blue-200'
      } bg-white`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-blue-100 bg-blue-50/50 rounded-t-xl drag-handle cursor-grab">
        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <span className="text-xs font-semibold text-blue-700">{nodeData.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500">
          {kind === 'webhook' && (nodeData.webhookUrl ? (
            <span className="font-mono text-blue-500 truncate block">{nodeData.webhookUrl}</span>
          ) : 'Webhook 触发')}
          {kind === 'scheduled' && '定时触发'}
          {kind === 'bitable_event' && '多维表格事件'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-white"
      />
    </div>
  );
}
