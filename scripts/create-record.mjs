/**
 * 独立脚本 — 向飞书多维表格新增记录
 *
 * 用法：
 *   node scripts/create-record.mjs "文本=你好世界"
 *   node scripts/create-record.mjs "文本=测试内容" "日期=2026-06-12" "单选=选项1"
 *
 * 不依赖浏览器/OAuth，只用 tenant_access_token 鉴权
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

async function main() {
  const env = loadEnv();
  const appId = env.APP_ID || '';
  const appSecret = env.APP_SECRET || '';

  // ====== 按需修改下面的配置 ======
  const APP_TOKEN = 'PftlbbwAwaiAiesAWkQc6nH8nAh';
  const TABLE_ID = 'tblmvALdf4si4jjy';

  // 解析命令行参数：格式为 "字段名=值"
  const args = process.argv.slice(2);
  const fields = {};

  if (args.length === 0) {
    fields['文本'] = '脚本自动创建';
    console.log('未提供参数，使用默认字段值:', fields);
  } else {
    for (const arg of args) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx === -1) {
        console.error(`参数格式错误: "${arg}"，应为 "字段名=值"`);
        process.exit(1);
      }
      fields[arg.slice(0, eqIdx)] = arg.slice(eqIdx + 1);
    }
  }

  console.log(`目标表: ${APP_TOKEN}/${TABLE_ID}`);
  console.log(`待写入字段:`, fields);

  // SDK Client 自动管理 tenant_access_token
  const client = new Client({ appId, appSecret });

  const res = await client.bitable.appTableRecord.create({
    path: { app_token: APP_TOKEN, table_id: TABLE_ID },
    data: { fields },
  });

  if (res.code !== 0) {
    console.error(`飞书错误 [${res.code}]: ${res.msg}`);
    console.error(JSON.stringify(res, null, 2));
    process.exit(1);
  }

  const record = res.data.record;
  console.log('\n✅ 记录创建成功!');
  console.log(`   record_id: ${record.record_id}`);
  console.log(`   fields:`, JSON.stringify(record.fields, null, 2));
}

main().catch((err) => {
  console.error('❌ 失败:', err.message);
  process.exit(1);
});
