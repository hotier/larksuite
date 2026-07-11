'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X, Mail, Phone, Building2, Copy, Check, Loader2, AtSign,
} from 'lucide-react';
import type { UserProfile } from '@/types';

interface NameCardProps {
  profile: UserProfile | undefined;
  name: string;
  anchorRect?: DOMRect;
  onClose: () => void;
  /** 打开时按需拉取完整名片（email/mobile/description 等）；不传则仅用已有 profile */
  onFetchProfile?: (openId: string) => Promise<UserProfile | null>;
}

export default function NameCard({ profile, name, anchorRect, onClose, onFetchProfile }: NameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // 计算弹窗位置（在点击元素右下方）
  useEffect(() => {
    if (!anchorRect) return;
    const gap = 8;
    const cardWidth = 300;
    const cardHeight = 300;
    let left = anchorRect.right + gap;
    let top = anchorRect.top;

    if (left + cardWidth > window.innerWidth - 16) {
      left = anchorRect.left - cardWidth - gap;
    }
    if (left < 16) {
      left = anchorRect.left;
    }
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }
    if (top < 16) top = 16;

    setPosition({ top, left });
  }, [anchorRect]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // 懒加载完整名片（basic_batch 只给 name，单条接口才有 email/mobile 等）
  useEffect(() => {
    if (!onFetchProfile || !profile?.open_id) return;
    const hasRich = Boolean(profile.avatar_url || profile.email || profile.mobile || profile.description);
    if (hasRich) return;
    let active = true;
    setLoading(true);
    onFetchProfile(profile.open_id)
      .then((p) => { if (active) setFullProfile(p); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onFetchProfile, profile]);

  // 复制文本
  const copy = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  if (!position) return null;

  const data = fullProfile || profile;
  const displayName = data?.name || name || '未知用户';
  const showEn = data?.en_name && data.en_name !== displayName;

  const initials = (displayName || '?')
    .split(/[\s\u3000]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || displayName[0]?.toUpperCase() || '?';

  return (
    <div
      ref={cardRef}
      className="fixed z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-left"
      style={{ top: position.top, left: position.left }}
    >
      <div className="w-[300px] bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden">
        {/* 头部浅蓝渐变 */}
        <div className="relative h-[72px] bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.95) 0, transparent 42%)' }}
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full text-sky-700/80 hover:text-sky-900 hover:bg-white/40 transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 头像（圆形） */}
        <div className="flex justify-center -mt-9 mb-2">
          <div className="relative">
            {data?.avatar_url && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatar_url}
                alt={displayName}
                className="w-[68px] h-[68px] rounded-full border-4 border-white shadow-md object-cover bg-white"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-[68px] h-[68px] rounded-full border-4 border-white shadow-md flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-sky-400 to-blue-500">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* 姓名 */}
        <div className="text-center px-5 mb-3">
          <h3 className="text-[15px] font-semibold text-neutral-900 leading-tight">{displayName}</h3>
          {showEn && (
            <p className="text-xs text-neutral-500 mt-0.5">{data?.en_name}</p>
          )}
          {data?.nickname && (
            <p className="text-xs text-neutral-400 mt-0.5">@{data.nickname}</p>
          )}
        </div>

        {/* 详细信息 */}
        <div className="px-4 pb-4">
          {loading ? (
            <div className="space-y-2 py-1">
              <div className="h-9 rounded-lg bg-neutral-100 animate-pulse" />
              <div className="h-9 rounded-lg bg-neutral-100 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-1">
              {data?.email && (
                <InfoRow
                  icon={Mail}
                  label="邮箱"
                  value={data.email}
                  copied={copied === 'email'}
                  onCopy={() => copy(data.email!, 'email')}
                />
              )}
              {data?.mobile && (
                <InfoRow
                  icon={Phone}
                  label="手机"
                  value={data.mobile}
                  copied={copied === 'mobile'}
                  onCopy={() => copy(data.mobile!, 'mobile')}
                />
              )}
              {data?.description && (
                <InfoRow icon={Building2} label="个性签名" value={data.description} />
              )}
              {!data?.email && !data?.mobile && !data?.description && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 py-2">
                  <AtSign className="w-3.5 h-3.5" />
                  暂无更多公开信息
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  onCopy,
  copied,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sky-50 transition-colors">
      <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="text-sm text-neutral-700 truncate">{value}</p>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-sky-200/60"
          aria-label={`复制${label}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>
      )}
    </div>
  );
}
