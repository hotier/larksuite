'use client';

import { useEffect, useState } from 'react';

/** 检查是否已登录：localStorage 中有有效 token */
function isTokenValid(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('feishu_user_token');
  const expire = localStorage.getItem('feishu_token_expire');
  if (!token || !expire) return false;
  const val = parseInt(expire);
  const exp = val > 10_000_000_000 ? val : Date.now() + val * 1000;
  if (Date.now() < exp) return true;
  // token 过期，清除
  localStorage.removeItem('feishu_user_token');
  localStorage.removeItem('feishu_token_expire');
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTokenValid()) {
      window.location.replace('/');
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
