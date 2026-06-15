import { NextResponse } from 'next/server';
import { bitableService } from '@/services/feishu-bitable';
import { setCode } from '@/lib/auth-code-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      const result = await bitableService.getUserAccessToken(code);
      const expireMs = Date.now() + result.expire * 1000;

      // 生成一次性交换码，通过 HttpOnly Cookie 传递（不出现在 URL）
      const exchangeCode = setCode({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expire: expireMs,
      });

      const response = NextResponse.redirect(new URL('/', request.url));

      // HttpOnly → JS 无法读取，XSS 攻击也偷不走
      // Secure → HTTPS 才发送（本地 http://localhost 时浏览器会允许）
      // SameSite=Lax → 同站请求自动携带，防止 CSRF
      // Max-Age=60 → 60 秒后自动过期
      response.cookies.set('auth_code', exchangeCode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60,
        path: '/',
      });

      return response;
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
