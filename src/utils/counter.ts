import { gsap } from 'gsap';

export interface RollOptions {
  duration?: number;
  decimals?: number;
  suffix?: string;
}

/** 数字滚动动画：el 的文本从 0 滚到 to */
export function rollNumber(el: HTMLElement, to: number, opts: RollOptions = {}): gsap.core.Tween {
  const obj = { v: 0 };
  return gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.2,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = obj.v.toFixed(opts.decimals ?? 0) + (opts.suffix ?? '');
    },
  });
}
