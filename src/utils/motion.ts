// 降级与设备开关（规格 §7）
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 模块级快照：一次性预算（particleCap）用它没问题，但按视口变化的几何量别用——改在调用处 window.matchMedia(...).matches 运行时判定（见 ch2-speed.ts run()）。
export const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Canvas 粒子限额：桌面 300 / 移动 120
export const particleCap = isMobile ? 120 : 300;
