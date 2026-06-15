/**
 * POST /api/workflows — 前端同步工作流到服务端
 *
 * 前端每次持久化后调用此接口，将工作流写入 JSON 文件，
 * 供 webhook 接收端读取执行。
 */

import { NextResponse } from 'next/server';
import { saveWorkflows, loadWorkflows } from '@/lib/workflow-store';

export async function POST(request: Request) {
  try {
    const { workflows } = await request.json();
    if (!Array.isArray(workflows)) {
      return NextResponse.json({ error: '缺少参数: workflows' }, { status: 400 });
    }
    saveWorkflows(workflows);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[api/workflows] 保存失败:', error);
    return NextResponse.json({ error: error.message || '保存失败' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const workflows = loadWorkflows();
    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error('[api/workflows] 读取失败:', error);
    return NextResponse.json({ error: error.message || '读取失败' }, { status: 500 });
  }
}
