'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return false;
}

/**
 * 暗色模式切换按钮。
 * 主题状态由 <html class="dark"> 与 localStorage('theme') 维护，
 * 首屏防闪烁脚本见 app/layout.tsx。
 * 用 useSyncExternalStore 读取主题，避免在 effect 中同步 setState（并规避 hydration 不一致）。
 */
export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const root = document.documentElement;
    const next = !dark;
    const apply = () => {
      root.classList.toggle('dark', next);
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        /* localStorage 不可用时忽略 */
      }
    };
    // 优先用 View Transitions：整页交叉淡入，平滑且无「逐元素过渡」导致的抖动
    // （多维表格等大数据页面、导航区/功能区反差边界尤其受益）。
    // 不支持的浏览器回退到 html.theme-transition 逐元素过渡。
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(apply);
    } else {
      root.classList.add('theme-transition');
      apply();
      window.setTimeout(() => root.classList.remove('theme-transition'), 450);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? '切换到浅色模式' : '切换到暗色模式'}
      title={dark ? '切换到浅色模式' : '切换到暗色模式'}
      className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
