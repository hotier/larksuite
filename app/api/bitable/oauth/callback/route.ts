import { NextResponse } from 'next/server';
import { bitableService } from '@/services/feishu-bitable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      const result = await bitableService.getUserAccessToken(code);
      
      return NextResponse.redirect(new URL(`/?token=${encodeURIComponent(result.accessToken)}&expire=${result.expire}`, request.url));
    }

    return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 });
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
