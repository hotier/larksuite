import { NextResponse } from 'next/server';
import { getExecutions } from '@/lib/execution-store';

/**
 * GET /api/executions — 获取执行日志列表（按时间倒序）
 * 可选 query: workflowId 过滤指定工作流
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflowId');

  let executions = getExecutions();

  if (workflowId) {
    executions = executions.filter((e) => e.workflowId === workflowId);
  }

  return NextResponse.json({
    code: 0,
    data: {
      total: executions.length,
      executions,
    },
  });
}
