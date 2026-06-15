'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Mail, Phone, User, Building } from 'lucide-react';
import type { UserProfile } from '@/types';

interface NameCardProps {
  profile: UserProfile | undefined;
  name: string;
  anchorRect?: DOMRect;
  onClose: () => void;
}

export default function NameCard({ profile, name, anchorRect, onClose }: NameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // 计算弹窗位置（在点击元素右下方）
  useEffect(() => {
    if (!anchorRect) return;
    const gap = 8;
    const cardWidth = 320;
    const cardHeight = 200;
    let left = anchorRect.right + gap;
    let top = anchorRect.top;

    // 如果右侧空间不够，显示在左侧
    if (left + cardWidth > window.innerWidth - 16) {
      left = anchorRect.left - cardWidth - gap;
    }
    // 如果左侧也不够，显示在下方
    if (left < 16) {
      left = anchorRect.left;
    }
    // 确保不超出底部
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }
    // 确保不超出顶部
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
    // 延迟绑定，避免触发 click 时立即关闭
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

  if (!position) return null;

  const displayName = profile?.name || name;
  const initials = displayName
    .split(/[\s\u3000]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || displayName[0]?.toUpperCase() || '?';

  return (
    <div
      ref={cardRef}
      className="fixed z-[100] animate-in fade-in zoom-in-95 origin-top-left"
      style={{ top: position.top, left: position.left }}
    >
      <div className="w-80 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* 头部渐变背景 */}
        <div className="relative h-20 bg-gradient-to-r from-blue-500 to-indigo-500">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 头像 */}
        <div className="flex justify-center -mt-8 mb-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div
            className={`w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-blue-400 to-indigo-500 ${profile?.avatar_url ? 'hidden' : ''}`}
          >
            {initials}
          </div>
        </div>

        {/* 姓名 */}
        <div className="text-center px-4 mb-3">
          <h3 className="text-base font-semibold text-neutral-900">{displayName}</h3>
          {profile?.en_name && (
            <p className="text-xs text-neutral-400 mt-0.5">{profile.en_name}</p>
          )}
        </div>

        {/* 详细信息 */}
        <div className="px-5 pb-4 space-y-2">
          {profile?.email && (
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-600 truncate">{profile.email}</span>
            </div>
          )}
          {profile?.mobile && (
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-600">{profile.mobile}</span>
            </div>
          )}
          {profile?.description && (
            <div className="flex items-start gap-2.5 text-sm">
              <Building className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-600 leading-relaxed">{profile.description}</span>
            </div>
          )}
          {!profile?.email && !profile?.mobile && !profile?.description && (
            <div className="flex items-center gap-2.5 text-sm">
              <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400">暂无更多信息</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
