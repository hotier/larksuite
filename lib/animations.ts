/**
 * 全站共用的内联动画样式（keyframes + 工具类）。
 * 首页登录加载动画与各页面 LoadingScreen 共享。
 */
export const ANIM_STYLES = `
  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-shimmer {
    animation: shimmer 4s ease-in-out infinite;
    background-size: 200% 200%;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.15); }
  }
  .animate-glow-pulse {
    animation: glow-pulse 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 5s ease-in-out infinite;
  }

  @keyframes glow-line {
    0%, 100% { background-position: -200% 0; }
    50% { background-position: 200% 0; }
  }
  .animate-glow-line {
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
    background-size: 200% 100%;
    animation: glow-line 3s ease-in-out infinite;
  }

  @keyframes spin-slower {
    to { transform: rotate(360deg); }
  }
  .animate-spin-slower {
    animation: spin-slower 4s linear infinite;
  }
`;
