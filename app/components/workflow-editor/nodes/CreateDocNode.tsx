'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FilePlus, Share2 } from 'lucide-react';

interface CreateDocNodeData {
  label?: string;
  docType?: string;
  title?: string;
  content?: string;
  shareLink?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  docx: '📝',
  sheet: '📊',
  slide: '🖼️',
  bitable: '🗂️',
};

export default function CreateDocNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CreateDocNodeData;
  const docType = nodeData.docType || 'docx';
  const preview = (nodeData.title || '').slice(0, 40);

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-lime-400 shadow-md ring-2 ring-lime-100' : 'border-lime-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-lime-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-50">
          <FilePlus className="h-4 w-4 text-lime-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '创建文档'}</span>
      </div>
      <div className="px-3 py-2">
        <span className="rounded bg-lime-50 px-2 py-0.5 text-xs text-lime-700">
          {TYPE_ICONS[docType] || '📄'} {({ docx: '文档', sheet: '表格', slide: '幻灯片', bitable: '多维表格' } as Record<string, string>)[docType] || docType}
        </span>
        {preview && (
          <div className="mt-1 text-xs text-slate-500 truncate">{preview}</div>
        )}
        {nodeData.shareLink && (
          <div className="mt-1 flex items-center gap-1 text-xs text-lime-600">
            <Share2 className="h-3 w-3" /> 生成分享链接
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-lime-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-lime-400" />
    </div>
  );
}
