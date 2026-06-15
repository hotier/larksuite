/**
 * 执行日志持久化存储
 * 数据文件：data/executions.json
 */

import fs from 'fs';
import path from 'path';
import type { Execution } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'executions.json');

/** 读取所有执行记录（按时间倒序，最多保留 200 条） */
export function getExecutions(): Execution[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const all: Execution[] = JSON.parse(raw);
    return all.sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime()).slice(0, 200);
  } catch {
    return [];
  }
}

/** 新增一条执行记录 */
export function appendExecution(exec: Execution): void {
  const all = getExecutions();
  all.unshift(exec); // 最新在前
  // 保留最近 200 条
  const trimmed = all.slice(0, 200);
  // 确保目录存在
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}
