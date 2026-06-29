/**
 * Delay 节点 - 延时等待
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';

interface DelayNodeData {
  label?: string;
  duration?: number;
  unit?: string;
}

const UNIT_LABEL: Record<string, string> = {
  seconds: '秒',
  minutes: '分钟',
  hours: '小时',
  days: '天',
};

export default function DelayNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as DelayNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-orange-200'
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-orange-100 bg-orange-50/50 rounded-t-xl drag-handle cursor-grab">
        <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-orange-600" />
        </div>
        <span className="text-xs font-semibold text-orange-700">{nodeData.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500">
          {nodeData.duration ? (
            <span>等待 {nodeData.duration} {UNIT_LABEL[nodeData.unit || 'minutes'] || nodeData.unit}</span>
          ) : (
            <span className="text-amber-500">未配置延时</span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
}
