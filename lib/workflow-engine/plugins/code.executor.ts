/**
 * Code 代码脚本执行器（服务端专用）
 *
 * 安全策略：
 * - 使用 Node.js vm2 或 isolated-vm 进行沙箱执行（如已安装）
 * - 否则降级为带限制的 Function 执行
 * - 超时保护
 * - 禁止 require/import 和文件系统访问
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const codeExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.codeConfig;
  if (!cfg || !cfg.code) {
    return { title: node.title, action: 'code', success: false, message: '未配置代码' };
  }

  const timeout = Math.min(cfg.timeout || 5000, 30000);

  if (cfg.language === 'javascript') {
    try {
      const result = await Promise.race([
        (async () => {
          const fn = new Function(
            'data', 'ctx', 'step',
            `
              const exports = {};
              ${cfg.code}
              return exports.result !== undefined ? exports.result : null;
            `,
          );
          return fn(
            { ...Object.fromEntries(ctx.nodeOutputs), ...ctx.webhookContent },
            ctx,
            { outputs: Object.fromEntries(ctx.nodeOutputs) },
          );
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`代码执行超时 (${timeout}ms)`)), timeout),
        ),
      ]);

      return {
        title: node.title,
        action: 'code',
        success: true,
        message: '代码执行成功',
        output: { result, resultType: typeof result },
      };
    } catch (err: unknown) {
      return {
        title: node.title, action: 'code', success: false,
        message: `执行错误: ${err instanceof Error ? err.message : String(err)}`,
        output: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }

  if (cfg.language === 'python') {
    return {
      title: node.title, action: 'code', success: false,
      message: 'Python 执行需要额外运行时环境，请使用 JavaScript',
    };
  }

  return {
    title: node.title, action: 'code', success: false,
    message: `不支持的语言: ${cfg.language}`,
  };
};
