import type { FieldType } from '@/types';

/**
 * 字段值格式化：前端展示（RecordManager）与导出（feishu-bitable.exportBitable）共享同一套逻辑。
 * 后续格式规则若有变动，只需修改本文件一处。
 *
 * 唯一的展示差异（前端空值显示「—」、导出显示空串）通过 emptyText 参数吸收。
 */

/** 时间戳转可读日期：YYYY-MM-DD HH:mm（本地时间） */
export function formatDateTime(raw: number | string): string {
  const ms = typeof raw === 'string' ? Number(raw) : raw;
  if (!ms || ms <= 0 || Number.isNaN(ms)) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 是否为日期/时间类字段 */
export function isDateField(type: FieldType | undefined): boolean {
  return type === 'date' || type === 'created_time' || type === 'updated_time';
}

/**
 * 尝试将值转为日期字符串：兼容 number / 数字字符串 / {timestamp} 对象
 * （飞书 date 字段常返回上述结构）。无法解析返回 null。
 */
export function tryFormatDate(value: unknown): string | null {
  let ms: number | null = null;
  if (typeof value === 'number') {
    ms = value;
  } else if (typeof value === 'string') {
    const n = Number(value);
    if (!Number.isNaN(n) && n > 946684800000) ms = n; // 合理的毫秒时间戳范围：> 2000-01-01
  } else if (value && typeof value === 'object' && 'timestamp' in (value as Record<string, unknown>)) {
    const t = (value as Record<string, unknown>).timestamp;
    if (typeof t === 'number') ms = t;
    else if (typeof t === 'string') { const n = Number(t); if (!Number.isNaN(n)) ms = n; }
  }
  if (ms == null || ms <= 0 || Number.isNaN(ms)) return null;
  return formatDateTime(ms);
}

/**
 * 把选项 id（optxxx）/ 选项对象 {text,id} / 它们的数组，还原为显示文字。
 * @param optionMap 选项 id → 显示文字 的映射
 * @param emptyText 空结果时的占位文本
 */
export function resolveOptionText(
  value: unknown,
  optionMap: Record<string, string>,
  emptyText = '',
): string {
  const toText = (v: unknown): string => {
    if (typeof v === 'string') return optionMap[v] || v;
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.text === 'string' && o.text) return o.text;
      if (typeof o.id === 'string' && o.id) return optionMap[o.id] || o.id;
    }
    return v == null ? emptyText : String(v);
  };
  if (Array.isArray(value)) {
    const parts = value.map(toText).filter(Boolean);
    return parts.length ? parts.join(', ') : emptyText;
  }
  return toText(value);
}

/**
 * 将飞书字段值格式化为可读字符串（前端展示 / 导出共用）。
 * @param value     字段原始值
 * @param fieldType 字段类型
 * @param opts.optionMap 选项 id → 显示文字 的全局映射（用于公式/单选/多选还原文字）
 * @param opts.emptyText 空值占位文本（前端传 '—'，导出传 ''，默认 ''）
 */
export function formatFieldValue(
  value: unknown,
  fieldType: FieldType | undefined,
  opts: { optionMap?: Record<string, string>; emptyText?: string } = {},
): string {
  const empty = opts.emptyText ?? '';
  const { optionMap } = opts;
  if (value === null || value === undefined) return empty;

  // 日期/时间类字段（飞书返回毫秒时间戳：number / 字符串 / {timestamp} 对象）
  if (isDateField(fieldType) || fieldType === 'created_by' || fieldType === 'updated_by') {
    const formatted = tryFormatDate(value);
    if (formatted) return formatted;
  }
  // 人员类字段（创建人/修改人）：飞书返回 [{id,name,type}] 数组，展示姓名
  if ((fieldType === 'created_by' || fieldType === 'updated_by') && Array.isArray(value)) {
    const names = (value as Record<string, unknown>[])
      .map((v) => (v && typeof v === 'object' ? (v.name as string) || (v.id as string) || '' : String(v)))
      .filter(Boolean);
    return names.length ? names.join(', ') : empty;
  }
  // 公式/单选/多选：值可能是选项 id（optxxx）、选项对象 {text,id}，或它们的数组
  if (
    (fieldType === 'formula' || fieldType === 'single_select' || fieldType === 'multi_select') &&
    optionMap
  ) {
    return resolveOptionText(value, optionMap, empty);
  }
  // 超链接：优先展示文字
  if (fieldType === 'url' && value && typeof value === 'object') {
    const u = value as { link?: string; text?: string };
    return u.text || u.link || empty;
  }
  // 数组（附件 / 多选等）
  if (Array.isArray(value)) {
    if (fieldType === 'file') {
      return value
        .map((v) => (typeof v === 'object' && v !== null ? (v as { name?: string }).name || '' : ''))
        .filter(Boolean)
        .join(', ');
    }
    return value
      .map((v) =>
        typeof v === 'object' && v !== null
          ? (v as { text?: string }).text || JSON.stringify(v)
          : String(v),
      )
      .join(', ');
  }
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.text === 'string' && o.text) return o.text;
    if (typeof o.name === 'string' && o.name) return o.name;
    return JSON.stringify(value);
  }
  return String(value);
}
