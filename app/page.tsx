'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Key, Table2, Workflow, Zap, FileText, Grid3X3 } from 'lucide-react';
import { fetchOAuthUrl, exchangeAuthCode } from '@/lib/api';

export default function RootPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [oauthUrl, setOauthUrl] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      let gotToken = false;
      const result = await exchangeAuthCode();
      if (result) {
        localStorage.setItem('feishu_user_token', result.accessToken);
        localStorage.setItem('feishu_token_expire', String(result.expire));
        setIsAuthenticated(true);
        gotToken = true;
      }

      if (!gotToken) {
        const storedToken = localStorage.getItem('feishu_user_token');
        const storedExpire = localStorage.getItem('feishu_token_expire');
        if (storedToken && storedExpire) {
          const val = parseInt(storedExpire);
          const exp = val > 10_000_000_000 ? val : Date.now() + val * 1000;
          if (Date.now() < exp) setIsAuthenticated(true);
          else {
            localStorage.removeItem('feishu_user_token');
            localStorage.removeItem('feishu_token_expire');
          }
        }
      }

      fetchOAuthUrl().then(setOauthUrl).catch(console.error);
      setChecking(false);
    };
    init();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('feishu_user_token');
    localStorage.removeItem('feishu_token_expire');
    setIsAuthenticated(false);
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      </div>
    );
  }

  /* ========== 未登录 ========== */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
            {/* Hero */}
            <div className="space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                <Key className="w-3 h-3" />
                飞书开放平台 · OAuth 2.0
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 leading-tight">
                多维表格
                <br />
                <span className="text-amber-600">管理中枢</span>
              </h1>

              <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
                通过飞书标准 OAuth 协议接入多维表格，统一管理数据表、记录与 Webhook 自动化工作流。
              </p>
            </div>

            {/* CTA */}
            <div className="mb-20">
              {oauthUrl ? (
                <a
                  href={oauthUrl}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-base font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <Key className="w-4 h-4" />
                  飞书授权登录
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="w-48 h-12 skeleton mx-auto" />
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-2xl mx-auto">
              {[
                {
                  icon: Table2,
                  title: '表格管理',
                  desc: '创建、浏览、编辑多维表格及数据表，实时同步飞书数据。',
                },
                {
                  icon: Workflow,
                  title: '自动化工作流',
                  desc: '配置 Webhook 触发规则，实现跨设备的自动 CRUD 操作。',
                },
                {
                  icon: Zap,
                  title: '安全鉴权',
                  desc: '飞书 OAuth 2.0 标准协议，HttpOnly Cookie 防护，Token 持久化。',
                },
              ].map((item) => (
                <div key={item.title}>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="py-8 text-center text-xs text-neutral-400">
          飞书开放平台 · Bitable API Manager
        </footer>
      </div>
    );
  }

  /* ========== 已登录：入口 ========== */
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-amber-600 text-white flex items-center justify-center">
              <Table2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 tracking-tight">
              飞书多维表格
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              已连接
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Entry Cards */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-3xl animate-fade-in">
          <Link
            href="/bitable"
            className="group p-8 rounded-xl bg-white border border-neutral-200 hover:border-amber-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Table2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-2">
              多维表格管理
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              管理表格、数据表与记录
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
              进入
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/docs"
            className="group p-8 rounded-xl bg-white border border-neutral-200 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-2">
              云文档管理
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              管理飞书云文档
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
              进入
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/sheets"
            className="group p-8 rounded-xl bg-white border border-neutral-200 hover:border-green-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-2">
              在线表格管理
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              管理飞书电子表格
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
              进入
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/flow"
            className="group p-8 rounded-xl bg-white border border-neutral-200 hover:border-amber-200 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 mb-2">
              机器人指令
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              Webhook 自动化工作流
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
              进入
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
