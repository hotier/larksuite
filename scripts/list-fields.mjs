/**
 * 独立脚本 — 列出数据表的所有字段
 *
 * 用法：
 *   node scripts/list-fields.mjs
 *   或指定参数：
 *   node scripts/list-fields.mjs PftlbbwAwaiAiesAWkQc6nH8nAh tblmvALdf4si4jjy
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@larksuiteoapi/node-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return env;
}

const FIELD_TYPE_NAMES = {
  1: 'text', 2: 'number', 3: 'single_select', 4: 'multi_select',
  5: 'date', 7: 'checkbox', 11: 'person', 15: 'url',
  17: 'file', 18: 'phone', 20: 'formula', 21: 'lookup',
  1001: 'created_time', 1002: 'created_by', 1003: 'updated_time', 1004: 'updated_by',
};

async function main() {
  const env = loadEnv();
  const appId = env.APP_ID || '';
  const appSecret = env.APP_SECRET || '';

  // 命令行参数 或 默认值
  const appToken = process.argv[2] || 'PftlbbwAwaiAiesAWkQc6nH8nAh';
  const tableId = process.argv[3] || 'tblmvALdf4si4jjy';

  // SDK Client 自动管理 tenant_access_token，无需手动获取
  const client = new Client({ appId, appSecret });

  // 1. 查字段
  const fieldsRes = await client.bitable.appTableField.list({
    path: { app_token: appToken, table_id: tableId },
  });
  if (fieldsRes.code !== 0) {
    throw new Error(`列字段失败 [${fieldsRes.code}]: ${fieldsRes.msg}`);
  }

  // 2. 查表信息（获取表名）
  const tablesRes = await client.bitable.appTable.list({
    path: { app_token: appToken },
  });
  const table = tablesRes.code === 0
    ? tablesRes.data?.items?.find(t => t.table_id === tableId)
    : undefined;

  console.log('========================================');
  console.log(`  应用: ${appToken}`);
  console.log(`  数据表: ${table?.name || tableId} (${tableId})`);
  console.log('========================================');
  console.log('');
  console.log('  字段列表 (create 时用 name 作为 key):');
  console.log('');

  const items = fieldsRes.data?.items || [];
  for (const f of items) {
    const typeName = FIELD_TYPE_NAMES[f.type] || `unknown(${f.type})`;
    console.log(`  ✓  name: "${f.field_name}"`);
    console.log(`     field_id: ${f.field_id}    type: ${typeName}`);
    if (f.is_primary) console.log('     [主字段]');
    console.log('');
  }

  console.log('========================================');
  console.log(`  共 ${items.length} 个字段`);
  console.log('');
  console.log('  创建记录示例:');
  const primary = items.find(f => f.is_primary);
  if (primary) {
    console.log(`  node scripts/create-record.mjs "${primary.field_name}=你的内容"`);
  }
  console.log('');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
