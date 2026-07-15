/**
 * Next.js 服务端 instrumentation
 *
 * 数据库迁移的「主路径」已移至部署阶段（见 package.json 的 vercel-build /
 * migrate 脚本，命中 scripts/migrate.ts）。这里仅在本地开发（next dev）时
 * 自动建表，省去手动跑迁移命令；线上不在此执行，避免冷启动并发建表。
 *
 * 运行时各 API 路由仍通过 ensureMigrations() 做惰性兜底（安全网）。
 */
export async function register() {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_RUNTIME === 'nodejs'
  ) {
    const { runMigrations } = await import('@/lib/db');
    try {
      await runMigrations();
      console.log('[instrumentation] 开发环境数据库迁移完成');
    } catch (err) {
      console.error('[instrumentation] 开发环境数据库迁移失败:', err);
    }
  }
}
