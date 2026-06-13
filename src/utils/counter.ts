import { gsap } from 'gsap';

export interface RollOptions {
  duration?: number;
  decimals?: number;
  suffix?: string;
}

// 记录每个元素当前的滚动 tween，重复调用时先 kill 旧的，避免两个 tween 同时写 textContent
const active = new WeakMap<HTMLElement, gsap.core.Tween>();

/** 数字滚动动画：el 的文本从 0 滚到 to；对同一元素重复调用是安全的（自动终止上一次） */
export function rollNumber(el: HTMLElement, to: number, opts: RollOptions = {}): gsap.core.Tween {
  active.get(el)?.kill();
  const obj = { v: 0 };
  const tween = gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.2,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = obj.v.toFixed(opts.decimals ?? 0) + (opts.suffix ?? '');
    },
  });
  active.set(el, tween);
  return tween;
}
