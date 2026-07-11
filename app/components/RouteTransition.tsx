'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

type Accent = 'amber' | 'sky' | 'emerald' | 'violet';

interface TransitionMeta {
  label?: string;
  accent?: Accent;
}

interface RouteTransitionContextValue {
  /** 触发带全屏加载动画的路由跳转 */
  navigate: (href: string, meta?: TransitionMeta) => void;
  /** 子页面挂载后调用，结束过渡动画 */
  endTransition: () => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

export function useRouteTransition() {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) throw new Error('useRouteTransition 必须在 RouteTransitionProvider 内使用');
  return ctx;
}

// 过渡动画最短显示时长（ms），确保页面名标签可被看清，而非一闪而过
const MIN_DURATION = 600;

export default function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [meta, setMeta] = useState<TransitionMeta>({});
  const startRef = useRef(0);
  const endPendingRef = useRef(false);

  const navigate = useCallback((href: string, m?: TransitionMeta) => {
    setMeta(m ?? {});
    setActive(true);
    startRef.current = Date.now();
    endPendingRef.current = false;
    // 让覆盖层先渲染一帧，再跳转，避免动画被瞬间卸载
    requestAnimationFrame(() => router.push(href));
  }, [router]);

  const endTransition = useCallback(() => {
    if (!active) return;
    const elapsed = Date.now() - startRef.current;
    if (elapsed >= MIN_DURATION) {
      setActive(false);
    } else {
      // 子页面已就绪，但仍需满足最短展示时长，避免动画一闪而过
      endPendingRef.current = true;
      setTimeout(() => {
        if (endPendingRef.current) setActive(false);
      }, MIN_DURATION - elapsed);
    }
  }, [active]);

  return (
    <RouteTransitionContext.Provider value={{ navigate, endTransition }}>
      {children}
      {active && (
        <div className="fixed inset-0 z-[100]">
          <LoadingScreen
            label={meta.label ?? 'Lark Workspace'}
            accent={meta.accent ?? 'amber'}
            fullScreen
          />
        </div>
      )}
    </RouteTransitionContext.Provider>
  );
}
