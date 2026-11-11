// 降级与设备开关（规格 §7）
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 模块级快照：一次性预算（particleCap）用它没问题，但按视口变化的几何量别用——改在调用处 window.matchMedia(...).matches 运行时判定（见 journey.ts 的 measure()）。
export const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Canvas 粒子限额：桌面 300 / 移动 120
export const particleCap = isMobile ? 120 : 300;

// ---------- v3 共享动效约定（v3 规格 §3.1） ----------
// 新写的动画一律用这组命名缓动与时长，不再各写各的 power1 / power2。
// 同名的 CSS 自定义属性在 tokens.css（--ease-* / --dur-*），两边数值对应。

/** GSAP 缓动名 */
export const EASE = {
  /** 一般的移动、淡入：快起慢停 */
  soft: 'power2.out',
  /** 来回摆动、往返 */
  inOut: 'power2.inOut',
  /** 重的东西停稳：收得更干脆，不回弹 */
  settle: 'power3.out',
  /** 弹入、pop：略微冲过头再回来 */
  spring: 'back.out(1.7)',
  /** 挤压后的回弹：抖两下停住 */
  bouncy: 'elastic.out(1, 0.5)',
  /** 自由下落：越落越快 */
  fall: 'power2.in',
} as const;

/** 时长（秒） */
export const DUR = {
  /** 表情交叉淡入、hover 级反馈 */
  instant: 0.18,
  /** 小部件弹入、pop */
  quick: 0.35,
  /** 一般的一次性动作 */
  base: 0.6,
  /** 大幅移动、回弹收尾 */
  slow: 1,
} as const;

// 「在场才动」：所有无限循环的 CSS 动画给元素加 .anim-loop 类——它默认暂停，
// 只有自己或某个祖先带 .in-view 时才运行（规则在 base.css，带 !important，章节 CSS 里的 animation 简写压不过它）。
const inViewStops = new WeakMap<Element, () => void>();
let inViewObserver: IntersectionObserver | null = null;

/**
 * 元素进出视口时给它切换 .in-view 类。返回取消观察的函数（会顺手摘掉 .in-view）。
 * 同一个元素重复调用是安全的。全站共用一个 IntersectionObserver。
 * 不支持 IntersectionObserver 的环境直接视为一直在场。
 */
export function observeInView(el: Element): () => void {
  const existing = inViewStops.get(el);
  if (existing) return existing;
  if (typeof IntersectionObserver === 'undefined') {
    el.classList.add('in-view');
    return () => el.classList.remove('in-view');
  }
  inViewObserver ??= new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('in-view', e.isIntersecting);
  });
  inViewObserver.observe(el);
  const stop = (): void => {
    inViewObserver?.unobserve(el);
    inViewStops.delete(el);
    el.classList.remove('in-view');
  };
  inViewStops.set(el, stop);
  return stop;
}
