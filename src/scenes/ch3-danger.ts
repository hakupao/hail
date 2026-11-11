import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { rollNumber } from '../utils/counter';
import { reducedMotion } from '../utils/motion';

// 第三章 · 危险阈值（v2 规格 §4）。
// 尺寸阶梯、安全卡都是静态 HTML/CSS；本章唯一的主菜动画是动能条。
export function initCh3(section: HTMLElement): void {
  // 历史卡里的雹宝（默哀）与安全卡旁的雹宝（戴盔，静态）
  const historyMascot = createMascot(84, reducedMotion ? 'solemn' : 'happy');
  section.querySelector('.history-mascot-slot')!.appendChild(historyMascot.el);
  section.querySelector('.safety-mascot-slot')!.appendChild(createMascot(88, 'safety').el);

  // reduced-motion：动能条的终态宽度与读数就是 HTML/CSS 的默认值，不需要再做什么
  if (reducedMotion) return;

  // 主菜：三根动能条在同一把刻度尺上涨起来 + 焦耳数滚动。
  // 条的终态宽度由 CSS 按 焦耳数 / 200 给出，这里只用百分比位移把它从左侧揭开（不量像素，resize 安全）。
  const rows = Array.from(section.querySelectorAll<HTMLElement>('.energy-row')).map((row) => ({
    joules: Number(row.dataset.joules),
    // 条与读数的「骑手」等宽，一起做同一个百分比位移：读数始终贴着条尾
    moving: row.querySelectorAll<HTMLElement>('.energy-fill, .energy-rider'),
    num: row.querySelector<HTMLElement>('.energy-num')!,
  }));
  for (const { moving, num } of rows) {
    gsap.set(moving, { x: 0, xPercent: -100 });
    num.textContent = '0 J';
  }
  ScrollTrigger.create({
    trigger: section.querySelector('.energy'),
    start: 'top 72%',
    once: true,
    onEnter() {
      rows.forEach(({ joules, moving, num }, i) => {
        // 条越长涨得越久，三根条的「涨速」看起来接近
        const duration = 0.7 + joules / 140;
        const delay = i * 0.3;
        gsap.to(moving, { xPercent: 0, duration, delay, ease: 'power2.out' });
        gsap.delayedCall(delay, () => rollNumber(num, joules, { duration, suffix: ' J' }));
      });
    },
  });

  // 历史卡：进入时雹宝默哀，卡片在场期间把上方的图形（不含文字）压淡；往回滚恢复
  ScrollTrigger.create({
    trigger: section.querySelector('.history-card'),
    start: 'top 72%',
    end: 'bottom 12%',
    onToggle: (self) => section.classList.toggle('dimmed', self.isActive),
    onEnter: () => historyMascot.setExpression('solemn'),
    onLeaveBack: () => historyMascot.setExpression('happy'),
  });
}
