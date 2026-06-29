'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Upload } from 'lucide-react';

interface UploadFileNodeData {
  label?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

export default function UploadFileNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as UploadFileNodeData;
  const fileType = nodeData.fileType || 'auto';

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-purple-400 shadow-md ring-2 ring-purple-100' : 'border-purple-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-purple-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
          <Upload className="h-4 w-4 text-purple-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '上传文件'}</span>
      </div>
      <div className="px-3 py-2">
        {fileType !== 'auto' && (
          <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
            {{ docx: '文档', sheet: '表格', image: '图片', pdf: 'PDF' }[fileType] || fileType}
          </span>
        )}
        {nodeData.fileName && (
          <div className="mt-1 text-xs text-slate-500 truncate">{nodeData.fileName}</div>
        )}
        {nodeData.fileUrl && (
          <div className="mt-0.5 text-xs text-slate-400 truncate">{nodeData.fileUrl.slice(0, 60)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
}
