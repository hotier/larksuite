'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Code2 } from 'lucide-react';

interface CodeNodeData {
  label?: string;
  language?: string;
  code?: string;
}

export default function CodeNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CodeNodeData;
  const lang = nodeData.language || 'javascript';
  const preview = (nodeData.code || '').replace(/\n/g, ' ').slice(0, 60);

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-gray-400 shadow-md ring-2 ring-gray-100' : 'border-gray-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
          <Code2 className="h-4 w-4 text-gray-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '代码脚本'}</span>
      </div>
      <div className="px-3 py-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
          lang === 'javascript' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {lang === 'javascript' ? 'JavaScript' : 'Python'}
        </span>
        {preview && (
          <div className="mt-1 rounded bg-gray-50 px-2 py-1 font-mono text-xs text-slate-500 truncate">
            {preview}{preview.length >= 60 ? '...' : ''}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
