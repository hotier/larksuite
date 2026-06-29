/**
 * End 节点 - 流程结束
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CircleCheck } from 'lucide-react';

export default function EndNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-green-200'
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-green-100 bg-green-50/50 rounded-t-xl">
        <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
          <CircleCheck className="w-3.5 h-3.5 text-green-600" />
        </div>
        <span className="text-xs font-semibold text-green-700">{String(data.label || '结束')}</span>
      </div>
      <div className="px-3 py-1.5">
        <div className="text-[10px] text-neutral-400">流程结束</div>
      </div>
    </div>
  );
}
