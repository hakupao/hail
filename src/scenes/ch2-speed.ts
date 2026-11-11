import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isRefIcon, refIcon } from '../art/ch2';
import { raceLanes } from '../content';
import { terminalVelocity } from '../lab/model';
import { rollNumber } from '../utils/counter';
import { reducedMotion } from '../utils/motion';

const GAUGE_MAX_KMH = 160; // 赛道速度条的满格（index.html 里的 --f 与两道刻线按它换算）
const D_MAX = 8; // 曲线图横轴上限（cm），与 index.html 里 SVG 的 viewBox 宽一致
const V_MAX = 45; // 曲线图纵轴上限（m/s），与 viewBox 高一致

/** v = K·√d 的折线路径（viewBox 即数据坐标，y 朝下）。0 附近斜率无穷所以加密；d = 4 是显式采样点。 */
function curvePath(): string {
  const ds = [0, 0.0125, 0.025, 0.05];
  for (let i = 1; i <= D_MAX * 10; i++) ds.push(i / 10);
  return ds
    .map((d, i) => `${i ? 'L' : 'M'}${+d.toFixed(4)} ${+(V_MAX - terminalVelocity(d)).toFixed(3)}`)
    .join('');
}

export function initCh2(section: HTMLElement): void {
  const race = section.querySelector<HTMLElement>('.race')!;
  const lanes = Array.from(section.querySelectorAll<HTMLElement>('.lane')).map((lane) => ({
    drop: lane.querySelector<HTMLElement>('.lane-drop')!,
    ball: lane.querySelector<HTMLElement>('.race-ball')!,
    read: lane.querySelector<HTMLElement>('.lane-kmh')!,
    fill: lane.querySelector<HTMLElement>('.lane-gauge-fill')!,
  }));
  const chart = section.querySelector<HTMLElement>('.vchart')!;

  for (const el of section.querySelectorAll<HTMLElement>('.lane-icon')) {
    if (isRefIcon(el.dataset.ref)) el.innerHTML = refIcon(el.dataset.ref);
  }

  // 曲线图：曲线取简化模型，圆点取速度表典型值（两者故意不同，见 content.ts 的说明）
  section.querySelector('.vchart-curve')!.setAttribute('d', curvePath());
  section.querySelectorAll<HTMLElement>('.vdot').forEach((dot, i) => {
    dot.style.left = `${(raceLanes[i].d / D_MAX) * 100}%`;
    dot.style.bottom = `${(raceLanes[i].v / V_MAX) * 100}%`;
  });

  // reduced-motion：CSS 的静态布局就是终态（球在地面、读数为终值、曲线完整），什么都不用做
  if (reducedMotion) return;

  // ---------- 主菜：坠落竞速 ----------
  // 球的终点是它的布局位置（.lane-drop 的底边），动画只是从 y = −落差 回到 0。
  // 所以跑完后没有残留位移，resize、换字体都不会让终点过期；落差在每次开跑时现量。
  const fastest = Math.max(...raceLanes.map((l) => l.v));
  const moving = lanes.flatMap((l) => [l.ball, l.fill]);

  function run(): void {
    race.classList.remove('is-waiting');
    gsap.killTweensOf(moving);
    gsap.set(moving, { clearProps: 'transform' }); // 清掉被打断的上一场留下的变换
    lanes.forEach(({ drop, ball, read, fill }, i) => {
      const { v, kmh } = raceLanes[i];
      const dist = drop.clientHeight - ball.offsetHeight;
      const duration = 1.2 * (fastest / v); // 用时 ∝ 1/速度
      gsap.fromTo(ball, { y: -dist }, { y: 0, duration, ease: 'power1.in', clearProps: 'transform' });
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        { scaleX: kmh / GAUGE_MAX_KMH, duration, ease: 'power2.out', clearProps: 'transform' },
      );
      rollNumber(read, kmh, { duration });
    });
  }

  // 开跑前：球停在赛道顶、读数归零（CSS 的 .is-waiting）
  race.classList.add('is-waiting');
  for (const { read } of lanes) read.textContent = '0';
  ScrollTrigger.create({ trigger: race, start: 'top 65%', once: true, onEnter: run });
  section.querySelector<HTMLButtonElement>('.race-replay')!.addEventListener('click', run);

  // ---------- 主菜的延续：曲线一次性描出，四个点依次落下 ----------
  const clip = section.querySelector<SVGRectElement>('#vchart-clip rect')!;
  const fullWidth = clip.width.baseVal.value;
  gsap
    .timeline({ scrollTrigger: { trigger: chart, start: 'top 70%', once: true } })
    .fromTo(clip, { attr: { width: 0 } }, { attr: { width: fullWidth }, duration: 1.4, ease: 'power1.inOut' })
    .fromTo(
      section.querySelectorAll('.vdot'),
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.in', stagger: 0.22, clearProps: 'transform,opacity' },
      '-=0.15',
    );
}
