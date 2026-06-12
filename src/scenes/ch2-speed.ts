import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { raceLanes } from '../content';
import { rollNumber } from '../utils/counter';
import { isMobile, reducedMotion } from '../utils/motion';

export function initCh2(section: HTMLElement): void {
  const lanes = Array.from(section.querySelectorAll<HTMLElement>('.lane'));
  const replay = section.querySelector<HTMLButtonElement>('.race-replay')!;
  const fastest = Math.max(...raceLanes.map((l) => l.v));

  function run(): void {
    lanes.forEach((lane, i) => {
      const { v, kmh } = raceLanes[i];
      const ball = lane.querySelector<HTMLElement>('.race-ball')!;
      const dial = lane.querySelector<HTMLElement>('.race-dial')!;
      // 桌面：纵向下落赛道；移动端（Task 14 将赛道改为上下排列的横向条带）：沿 x 轴竞速
      const axis = isMobile ? 'x' : 'y';
      const dist = isMobile
        ? lane.clientWidth - ball.clientWidth - 130 // 右侧留出标签空间
        : lane.clientHeight - ball.clientHeight - 60; // 底部留出标签空间
      const dur = reducedMotion ? 0.01 : 1.2 * (fastest / v); // 用时 ∝ 1/速度
      gsap.fromTo(ball, { [axis]: 0 }, { [axis]: dist, duration: dur, ease: 'power1.in' });
      rollNumber(dial, kmh, { duration: dur, suffix: ' km/h' });
    });
  }

  // 进入视口自动开跑一次，按钮可重赛
  ScrollTrigger.create({ trigger: section, start: 'top 60%', once: true, onEnter: run });
  replay.addEventListener('click', run);

  if (reducedMotion) return;

  // 公式描线式显现
  gsap.fromTo(
    section.querySelector('.formula'),
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.2,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: section, start: 'top 70%' },
    },
  );

  // 速度表逐行点亮
  gsap.from(section.querySelectorAll('.speed-row'), {
    opacity: 0,
    x: -40,
    stagger: 0.2,
    scrollTrigger: { trigger: section.querySelector('.speed-table'), start: 'top 80%', once: true },
  });
}
