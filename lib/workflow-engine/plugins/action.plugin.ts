/**
 * CRUD 动作节点插件（4 个子类型）
 *
 * execute 逻辑已移至 action.executor.ts（服务端专用），
 * 避免客户端 bundle 引入 @larksuiteoapi/node-sdk。
 */

import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { WorkflowNode, FieldMapping, FilterCondition } from '@/types';
import type { NodePlugin } from '../node-registry';
import ActionNode from '@/app/components/workflow-editor/nodes/ActionNode';

// ---- 子类型元数据 ----

const META: Record<string, {
  actionType: 'create_record' | 'read_records' | 'update_record' | 'delete_record';
  displayName: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}> = {
  create_record: {
    actionType: 'create_record', displayName: '新增记录',
    description: '在数据表中创建一条新记录',
    icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
  },
  read_records: {
    actionType: 'read_records', displayName: '查询记录',
    description: '按条件查询记录列表',
    icon: Search, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
  },
  update_record: {
    actionType: 'update_record', displayName: '更新记录',
    description: '按条件更新已有记录',
    icon: Pencil, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
  },
  delete_record: {
    actionType: 'delete_record', displayName: '删除记录',
    description: '按条件删除匹配的记录',
    icon: Trash2, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
  },
};

// ---- 工厂 ----

function createActionPlugin(meta: (typeof META)[string]): NodePlugin {
  return {
    kind: 'action',
    rfType: 'actionNode',
    displayName: meta.displayName,
    description: meta.description,
    icon: meta.icon,
    color: meta.color,
    bg: meta.bg,
    border: meta.border,
    miniMapColor: '#f59e0b',
    category: 'action' as const,
    actionType: meta.actionType,

    defaults: () => ({
      actionType: meta.actionType,
      targetAppToken: '',
      targetTableId: '',
      targetTableName: '',
      fieldMappings: [] as FieldMapping[],
      filters: [] as FilterCondition[],
      filterLogic: 'and' as const,
    }),

    component: ActionNode,

    deserialize: (wfNode: WorkflowNode) => {
      const cfg = wfNode.actionConfig;
      return {
        label: cfg?.action ? META[cfg.action]?.displayName || meta.displayName : wfNode.title,
        actionType: cfg?.action || meta.actionType,
        targetAppToken: cfg?.targetAppToken || '',
        targetTableId: cfg?.targetTableId || '',
        targetTableName: cfg?.targetTableName || '',
        fieldMappings: cfg?.fieldMappings || [],
        filters: cfg?.filters || [],
        filterLogic: cfg?.filterLogic || 'and',
      };
    },

    serialize: (data: Record<string, unknown>) => ({
      actionConfig: {
        action: (data.actionType as string) || meta.actionType,
        targetAppToken: (data.targetAppToken as string) || '',
        targetTableId: (data.targetTableId as string) || '',
        targetTableName: (data.targetTableName as string) || '',
        fieldMappings: (data.fieldMappings as FieldMapping[]) || [],
        filters: (data.filters as FilterCondition[]) || [],
        filterLogic: (data.filterLogic as string) || 'and',
      },
    }),
  };
}

export const actionCreatePlugin = createActionPlugin(META.create_record);
export const actionReadPlugin = createActionPlugin(META.read_records);
export const actionUpdatePlugin = createActionPlugin(META.update_record);
export const actionDeletePlugin = createActionPlugin(META.delete_record);
