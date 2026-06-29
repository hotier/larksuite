'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BarChart3 } from 'lucide-react';

interface AggregateNodeData {
  label?: string;
  operation?: string;
  fieldName?: string;
  groupByField?: string;
}

const OP_LABELS: Record<string, string> = {
  count: '计数',
  sum: '求和',
  avg: '平均值',
  min: '最小值',
  max: '最大值',
  group_by: '分组统计',
};

export default function AggregateNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AggregateNodeData;
  const op = nodeData.operation || 'count';

  return (
    <div
      className={`w-[180px] rounded-xl border-2 bg-white shadow-sm transition-shadow ${
        selected ? 'border-cyan-400 shadow-md ring-2 ring-cyan-100' : 'border-cyan-200'
      }`}
    >
      <div className="drag-handle flex items-center gap-2 border-b border-cyan-100 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50">
          <BarChart3 className="h-4 w-4 text-cyan-600" />
        </div>
        <span className="text-sm font-medium text-slate-700">{nodeData.label || '数据聚合'}</span>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">
            {OP_LABELS[op] || op}
          </span>
          {nodeData.fieldName && (
            <span className="text-xs text-slate-500 truncate max-w-[80px]">{nodeData.fieldName}</span>
          )}
        </div>
        {nodeData.groupByField && (
          <div className="mt-1 text-xs text-slate-400">分组: {nodeData.groupByField}</div>
        )}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400" />
    </div>
  );
}
