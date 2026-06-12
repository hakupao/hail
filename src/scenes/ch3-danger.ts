import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { rollNumber } from '../utils/counter';
import { reducedMotion } from '../utils/motion';

export function initCh3(section: HTMLElement): void {
  // 历史卡片里的雹宝（默哀）与安全卡里的雹宝（戴盔）
  const historyMascot = createMascot(84, 'happy');
  section.querySelector('.history-mascot-slot')!.appendChild(historyMascot.el);
  // safetyMascot 创建后不再操作：'safety' 戴盔即其静态终态，属有意设计
  const safetyMascot = createMascot(64, 'safety');
  section.querySelector('.safety-mascot-slot')!.appendChild(safetyMascot.el);

  if (reducedMotion) {
    historyMascot.setExpression('solemn');
    section.querySelectorAll<HTMLElement>('.energy-fill').forEach((f, i) => {
      f.style.width = i === 0 ? '12%' : '92%';
    });
    return;
  }

  // ① 尺寸阶梯弹入
  gsap.from(section.querySelectorAll('.size-item'), {
    scale: 0,
    transformOrigin: '50% 100%',
    stagger: 0.18,
    ease: 'back.out(2)',
    scrollTrigger: { trigger: section.querySelector('.size-ladder'), start: 'top 72%', once: true },
  });

  // ② 危险色带指针随滚动右移（绿→红）
  gsap.fromTo(
    section.querySelector('.danger-pointer'),
    { left: '4%' },
    {
      left: '94%',
      ease: 'none',
      scrollTrigger: {
        trigger: section.querySelector('.size-ladder'),
        start: 'top 72%',
        end: 'bottom 30%',
        scrub: true,
      },
    },
  );

  // ③ 能量条增长 + 焦耳数滚动
  const energyTargets: Array<{ sel: string; joules: number; width: string }> = [
    { sel: '.energy-20', joules: 20, width: '12%' },
    { sel: '.energy-170', joules: 170, width: '92%' },
  ];
  for (const { sel, joules, width } of energyTargets) {
    const bar = section.querySelector<HTMLElement>(sel)!;
    const fill = bar.querySelector<HTMLElement>('.energy-fill')!;
    const num = bar.querySelector<HTMLElement>('.energy-num')!;
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.to(fill, { width, duration: 1.4, ease: 'power2.out' });
        rollNumber(num, joules, { duration: 1.4, suffix: ' J' });
      },
    });
  }

  // ④ 历史卡片：进入时整章压暗、雹宝默哀；往回滚恢复
  ScrollTrigger.create({
    trigger: section.querySelector('.history-card'),
    start: 'top 70%',
    onEnter() {
      historyMascot.setExpression('solemn');
      section.classList.add('dimmed');
    },
    onLeaveBack() {
      historyMascot.setExpression('happy');
      section.classList.remove('dimmed');
    },
  });

  // ⑤ 安全卡滑入
  gsap.from(section.querySelectorAll('.safety-card'), {
    y: 60,
    opacity: 0,
    stagger: 0.18,
    scrollTrigger: { trigger: section.querySelector('.safety-cards'), start: 'top 80%', once: true },
  });
}
