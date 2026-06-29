/**
 * HTTP 请求节点
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';

interface HttpNodeData {
  label?: string;
  url?: string;
  method?: string;
}

export default function HttpNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as HttpNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-teal-200'
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-teal-100 bg-teal-50/50 rounded-t-xl drag-handle cursor-grab">
        <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
          <Globe className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <span className="text-xs font-semibold text-teal-700">{nodeData.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500">
          {nodeData.url ? (
            <div className="truncate">
              <span className="font-mono text-teal-600">{nodeData.method || 'GET'}</span>{' '}
              {nodeData.url.substring(0, 40)}{nodeData.url.length > 40 ? '...' : ''}
            </div>
          ) : (
            <span className="text-amber-500">未配置 URL</span>
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
