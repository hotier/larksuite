'use client';

import { Sparkles } from 'lucide-react';
import { ANIM_STYLES } from '@/lib/animations';

type Accent = 'amber' | 'sky' | 'emerald' | 'violet';

const ACCENTS: Record<Accent, { from: string; to: string; border: string; shadow: string }> = {
  amber:   { from: 'from-amber-400',  to: 'to-orange-500',  border: 'border-amber-200',   shadow: 'shadow-amber-500/30' },
  sky:     { from: 'from-sky-400',   to: 'to-blue-500',    border: 'border-sky-200',     shadow: 'shadow-sky-500/30' },
  emerald: { from: 'from-emerald-400', to: 'to-green-500',  border: 'border-emerald-200', shadow: 'shadow-emerald-500/30' },
  violet:  { from: 'from-violet-400', to: 'to-purple-500',  border: 'border-violet-200',  shadow: 'shadow-violet-500/30' },
};

interface LoadingScreenProps {
  /** 底部文字，默认 "Lark Workspace" */
  label?: string;
  /** 主题色，默认 amber（与首页一致） */
  accent?: Accent;
  /** true=占满整个视口（h-screen）；false=占据内容区（min-h-[60vh]） */
  fullScreen?: boolean;
}

/**
 * 通用加载动画 —— 与首页登录加载动画一致：
 * 渐变方块 + 旋转虚线环 + 底部大写标签。
 */
export default function LoadingScreen({
  label = 'Lark Workspace',
  accent = 'amber',
  fullScreen = true,
}: LoadingScreenProps) {
  const a = ACCENTS[accent];
  return (
    <div
      className={`${fullScreen ? 'h-screen' : 'min-h-[60vh]'} flex flex-col items-center justify-center gap-6`}
      style={{ background: 'var(--page-bg)' }}
    >
      <style>{ANIM_STYLES}</style>
      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.from} ${a.to} flex items-center justify-center shadow-lg ${a.shadow}`}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className={`absolute -inset-2 rounded-2xl border-2 border-dashed ${a.border} animate-spin-slower`} />
      </div>
      <span className="text-xs font-medium text-neutral-400 tracking-widest uppercase">{label}</span>
    </div>
  );
}
