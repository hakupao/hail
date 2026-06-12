// 降级与设备开关（规格 §7）
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Canvas 粒子限额：桌面 300 / 移动 120
export const particleCap = isMobile ? 120 : 300;
