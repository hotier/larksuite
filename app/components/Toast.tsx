'use client';

import { useEffect, useState } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';
import type { ToastMessage } from '@/types';

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastMessage['type'], React.ComponentType<{ className?: string }>> = {
  success: Check, error: X, info: Info, warning: AlertTriangle,
};

const STYLES: Record<ToastMessage['type'], string> = {
  success: 'bg-emerald-50/90 border-emerald-200/60 text-emerald-800',
  error: 'bg-red-50/90 border-red-200/60 text-red-800',
  info: 'bg-neutral-50/90 border-neutral-200/60 text-neutral-700',
  warning: 'bg-amber-50/90 border-amber-200/60 text-amber-800',
};

const ICON_BG: Record<ToastMessage['type'], string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-neutral-500',
  warning: 'bg-amber-500',
};

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setExiting(true), 4000); return () => clearTimeout(timer); }, []);
  useEffect(() => { if (exiting) { const timer = setTimeout(onDismiss, 300); return () => clearTimeout(timer); } }, [exiting, onDismiss]);

  return (
    <div
      className={`animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md min-w-[320px] max-w-[420px] ${STYLES[message.type]} ${exiting ? 'opacity-0 translate-x-4 scale-95' : ''} transition-all duration-300`}
    >
      <span className={`flex-shrink-0 w-6 h-6 rounded-full ${ICON_BG[message.type]} text-white flex items-center justify-center`}>
        {(() => { const Icon = ICONS[message.type]; return <Icon className="w-3.5 h-3.5" />; })()}
      </span>
      <p className="flex-1 text-sm font-medium">{message.text}</p>
      <button
        onClick={() => setExiting(true)}
        className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-black/5 flex items-center justify-center text-current opacity-50 hover:opacity-100 transition"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  if (messages.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => (
        <div key={msg.id} className="pointer-events-auto">
          <ToastItem message={msg} onDismiss={() => onDismiss(msg.id)} />
        </div>
      ))}
    </div>
  );
}
