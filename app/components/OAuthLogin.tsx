'use client';

interface OAuthLoginProps {
  isAuthenticated: boolean;
  oauthUrl: string;
  isLoading: boolean;
  onFetchApps: () => void;
  onLogout: () => void;
  hideLogin?: boolean;
}

export default function OAuthLogin({
  isAuthenticated, oauthUrl, isLoading, onFetchApps, onLogout, hideLogin = false,
}: OAuthLoginProps) {
  if (!isAuthenticated && hideLogin) return null;

  if (!isAuthenticated) {
    return (
      <a
        href={oauthUrl}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: 'var(--accent)', boxShadow: '0 4px 24px -6px rgba(191,91,10,0.25)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        飞书授权登录
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium mr-2" style={{ color: 'var(--success)' }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--success)' }} />
        </span>
        已连接
      </span>

      <button
        onClick={onFetchApps} disabled={isLoading}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        同步
      </button>

      <button
        onClick={onLogout}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        退出
      </button>
    </div>
  );
}
