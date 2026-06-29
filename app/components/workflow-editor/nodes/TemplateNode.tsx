'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';

interface TemplateNodeData {
  label?: string;
  template?: string;
  engine?: string;
}

export default function TemplateNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TemplateNodeData;
  const preview = (nodeData.template || '').slice(0, 80);

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-amber-400 shadow-md ring-2 ring-amber-100' : 'border-amber-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-amber-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
          <FileText className="h-4 w-4 text-amber-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '模板渲染'}</span>
      </div>
      <div className="px-3 py-2">
        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {nodeData.engine === 'mustache' ? 'Mustache' : 'Handlebars'}
        </span>
        {preview && (
          <div className="mt-1 rounded bg-amber-50 px-2 py-1 font-mono text-xs text-slate-600 truncate">
            {preview}{preview.length >= 80 ? '...' : ''}
          </div>
        )}
        {!preview && <div className="text-xs text-slate-400">未配置模板</div>}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
    </div>
  );
}
