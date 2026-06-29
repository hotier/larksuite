/**
 * IM 消息节点 - 飞书消息发送
 */

'use client';

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';

interface ImNodeData {
  label?: string;
  msgType?: string;
  textContent?: string;
}

export default function ImNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ImNodeData;

  return (
    <div
      className={`w-[180px] rounded-xl border-2 shadow-sm transition-shadow ${
        selected ? 'border-blue-400 shadow-blue-100 shadow-md' : 'border-violet-200'
      } bg-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-violet-100 bg-violet-50/50 rounded-t-xl drag-handle cursor-grab">
        <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
          <MessageCircle className="w-3.5 h-3.5 text-violet-600" />
        </div>
        <span className="text-xs font-semibold text-violet-700">{nodeData.label}</span>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-neutral-500">
          {nodeData.msgType === 'text' ? (
            <div className="truncate">文本: {nodeData.textContent?.substring(0, 30) || '未配置'}</div>
          ) : nodeData.msgType === 'card' ? (
            <div>卡片消息</div>
          ) : (
            <span className="text-amber-500">未配置</span>
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
