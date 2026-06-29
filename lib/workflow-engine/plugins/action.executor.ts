/**
 * Action 节点执行器（服务端专用）
 *
 * 与 action.plugin.ts 分离以避免客户端 bundle 引入 @larksuiteoapi/node-sdk。
 */

import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

/**
 * 延迟导入 bitableService，仅在执行时加载（服务端）。
 * 此文件不会被客户端 bundle 引用。
 */
async function getBitableService() {
  const { bitableService } = await import('@/services/feishu-bitable');
  return bitableService;
}

// ---- 共享工具（与 action.plugin.ts 中的逻辑一致）----

function resolveFieldValues(
  node: WorkflowNode,
  ctx: ExecutionContext,
): Record<string, unknown> | null {
  const mappings = node.actionConfig?.fieldMappings;
  if (!mappings || mappings.length === 0) return null;

  const fields: Record<string, unknown> = {};
  for (const m of mappings) {
    if (m.source === 'manual') {
      fields[m.fieldName] = m.manualValue;
    } else if (m.source === 'webhook') {
      const key = m.webhookKey.startsWith('content.') ? m.webhookKey.slice('content.'.length) : m.webhookKey;
      fields[m.fieldName] = ctx.webhookContent[key] ?? '';
    } else if (m.source === 'variable') {
      const parts = m.variableKey.split(':');
      const root = ctx.nodeOutputs.get(parts[1]);
      fields[m.fieldName] = root ?? '';
    }
  }
  return fields;
}

function mkStep(
  title: string, action: string,
  success: boolean, message: string,
  output?: Record<string, unknown>,
  startTime?: number,
): ExecutionStep {
  return { title, action, success, message, durationMs: startTime ? Date.now() - startTime : undefined, output };
}

function requireConfig(node: WorkflowNode) {
  const cfg = node.actionConfig;
  if (!cfg || !cfg.targetAppToken || !cfg.targetTableId) {
    return { cfg: null, err: mkStep(node.title, 'action', false, '未配置目标数据表') };
  }
  return { cfg, err: null };
}

// ---- Executor ----

export const actionExecutor: NodeExecutor = async (node, ctx) => {
  const bitableService = await getBitableService();
  const stepStart = Date.now();
  const { cfg, err } = requireConfig(node);
  if (err) return err;
  if (!cfg) return mkStep(node.title, 'action', false, '未配置目标数据表', undefined, stepStart);

  const actionType = node.actionConfig?.action || 'read_records';

  try {
    switch (actionType) {
      case 'create_record': {
        const fields = resolveFieldValues(node, ctx);
        if (!fields || Object.keys(fields).length === 0) {
          return mkStep(node.title, 'create_record', false, '无字段映射', undefined, stepStart);
        }
        const rec = await bitableService.createRecord(cfg.targetAppToken, cfg.targetTableId, fields);
        return mkStep(node.title, 'create_record', true, `记录已创建 (${rec.record_id})`, {
          record_id: rec.record_id,
          fields: rec.fields as Record<string, unknown>,
          created_time: rec.created_time,
        }, stepStart);
      }
      case 'read_records': {
        const data = await bitableService.listRecords(cfg.targetAppToken, cfg.targetTableId, 100, '');
        const records = data.records ?? [];
        const first = records[0] as { record_id?: string; fields?: Record<string, unknown> } | undefined;
        return mkStep(node.title, 'read_records', true, `查询完成 — ${data.total ?? '?'} 条`, {
          records: records as unknown as Record<string, unknown>,
          total_count: data.total ?? 0,
          first_record_id: first?.record_id ?? '',
          first_record: first as unknown as Record<string, unknown>,
        }, stepStart);
      }
      case 'update_record': {
        const fields = resolveFieldValues(node, ctx);
        if (!fields || Object.keys(fields).length === 0) {
          return mkStep(node.title, 'update_record', false, '无字段映射', undefined, stepStart);
        }
        let recordId: string | null = null;
        if (cfg.filters && cfg.filters.length > 0) {
          recordId = await bitableService.findRecordByFilters(
            cfg.targetAppToken, cfg.targetTableId,
            cfg.filters as Array<{ fieldName: string; operator: string; value: string }>,
          );
        } else {
          const listData = await bitableService.listRecords(cfg.targetAppToken, cfg.targetTableId, 1, '');
          recordId = (listData?.records ?? [])[0]?.record_id ?? null;
        }
        if (!recordId) return mkStep(node.title, 'update_record', false, '无匹配记录', undefined, stepStart);
        const rec = await bitableService.updateRecord(cfg.targetAppToken, cfg.targetTableId, recordId, fields);
        return mkStep(node.title, 'update_record', true, '记录已更新', {
          record_id: recordId,
          fields: rec.fields as Record<string, unknown>,
          updated_time: rec.updated_time,
        }, stepStart);
      }
      case 'delete_record': {
        let recordId: string | null = null;
        if (cfg.filters && cfg.filters.length > 0) {
          recordId = await bitableService.findRecordByFilters(
            cfg.targetAppToken, cfg.targetTableId,
            cfg.filters as Array<{ fieldName: string; operator: string; value: string }>,
          );
        } else {
          const listData = await bitableService.listRecords(cfg.targetAppToken, cfg.targetTableId, 1, '');
          recordId = (listData?.records ?? [])[0]?.record_id ?? null;
        }
        if (!recordId) return mkStep(node.title, 'delete_record', false, '无匹配记录', undefined, stepStart);
        await bitableService.deleteRecord(cfg.targetAppToken, cfg.targetTableId, recordId);
        return mkStep(node.title, 'delete_record', true, '记录已删除', { record_id: recordId }, stepStart);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return mkStep(node.title, actionType, false, msg, undefined, stepStart);
  }

  return mkStep(node.title, actionType, false, `不支持的操作: ${actionType}`, undefined, stepStart);
};
