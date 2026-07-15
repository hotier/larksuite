/**
 * 部署时数据库迁移脚本
 *
 * 在「部署阶段」运行一次（见 package.json 的 vercel-build / migrate），
 * 建立并升级表结构。运行时各 API 路由仍保留 ensureMigrations() 惰性兜底，
 * 主要用于本地 next dev 首次访问时自动建表，以及在线上作为安全网。
 *
 * 用法：
 *   npm run migrate                       # 本地手动执行
 *   # 部署时由 vercel-build 自动执行：next build && tsx scripts/migrate.ts
 */
import { runMigrations } from '../lib/db';

async function main() {
  console.log('[migrate] 开始执行数据库迁移…');
  try {
    await runMigrations();
    console.log('[migrate] 数据库迁移完成');
    process.exit(0);
  } catch (err) {
    console.error('[migrate] 数据库迁移失败:', err);
    process.exit(1);
  }
}

main();
