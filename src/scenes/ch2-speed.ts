import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isRefIcon, refIcon } from '../art/ch2';
import { raceLanes } from '../content';
import { terminalVelocity } from '../lab/model';
import { createMascot } from '../mascot/mascot';
import { rollNumber } from '../utils/counter';
import { DUR, EASE, reducedMotion } from '../utils/motion';

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

/** 读数停住时放大回弹一下。用独立的 scale 属性：不碰 transform，播完不留内联样式 */
function pop(el: HTMLElement): void {
  el.animate([{ scale: 1 }, { scale: 1.24, offset: 0.35 }, { scale: 1 }], {
    duration: DUR.quick * 1000,
    easing: 'ease-out',
  });
}

export function initCh2(section: HTMLElement): void {
  const race = section.querySelector<HTMLElement>('.race')!;
  const heaviest = Math.max(...raceLanes.map((l) => l.d));
  const lanes = Array.from(section.querySelectorAll<HTMLElement>('.lane')).map((lane, i) => {
    const drop = lane.querySelector<HTMLElement>('.lane-drop')!;
    // .race-ball 是被位移、被测量的盒子；看得见的球是它里面的 .race-ball-body，脸和挤压都在这一层
    const ball = lane.querySelector<HTMLElement>('.race-ball')!;
    const body = ball.querySelector<HTMLElement>('.race-ball-body')!;
    // 小脸：黄豆只有 10px，贴不下一张脸，只点两只眼睛（CSS）
    let face = null;
    if (raceLanes[i].d < 2) {
      body.classList.add('has-dots');
    } else {
      face = createMascot(0, 'happy', { bare: true });
      face.el.classList.add('race-face');
      face.el.style.width = face.el.style.height = ''; // 尺寸交给 ch2.css
      body.appendChild(face.el);
    }
    return {
      drop,
      ball,
      body,
      face,
      ground: drop.querySelector<HTMLElement>('.lane-ground')!,
      read: lane.querySelector<HTMLElement>('.lane-kmh')!,
      fill: lane.querySelector<HTMLElement>('.lane-gauge-fill')!,
    };
  });
  const chart = section.querySelector<HTMLElement>('.vchart')!;

  for (const el of section.querySelectorAll<HTMLElement>('.lane-icon')) {
    if (isRefIcon(el.dataset.ref)) el.innerHTML = refIcon(el.dataset.ref);
  }

  // 曲线图：曲线取简化模型，圆点取速度表典型值（两者故意不同，见 content.ts 的说明）
  section.querySelector('.vchart-curve')!.setAttribute('d', curvePath());
  const dots = Array.from(section.querySelectorAll<HTMLElement>('.vdot'));
  dots.forEach((dot, i) => {
    dot.style.left = `${(raceLanes[i].d / D_MAX) * 100}%`;
    dot.style.bottom = `${(raceLanes[i].v / V_MAX) * 100}%`;
  });

  // reduced-motion：CSS 的静态布局就是终态（球在地面、读数为终值、曲线完整），什么都不用做
  if (reducedMotion) return;

  // ---------- 推导：两条式子先后出现（先列平衡，再得结论） ----------
  gsap.fromTo(
    section.querySelectorAll('.ch2-math .tex-display'),
    { opacity: 0, y: 8 },
    {
      opacity: 1,
      y: 0,
      duration: DUR.base,
      ease: EASE.soft,
      stagger: 0.4,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: section.querySelector('.ch2-math'), start: 'top 78%', once: true },
    },
  );

  // ---------- 主菜：坠落竞速 ----------
  // 球的终点是它的布局位置（.lane-drop 的底边），动画只是从 y = −落差 回到 0。
  // 所以跑完后没有残留位移，resize、换字体都不会让终点过期；落差在每次开跑时现量。
  // 落地的挤压、尘团、地面线的颤动都作用在别的元素上，球盒本身只有这一段位移。
  const fastest = Math.max(...raceLanes.map((l) => l.v));
  const fx = lanes.map((lane, i) => {
    // 速度线：跟着球盒走，长度上限按速度定（--v），下落中随速度变长
    const streak = document.createElement('i');
    streak.className = raceLanes[i].d < 2 ? 'race-streak is-thin' : 'race-streak';
    streak.style.setProperty('--v', String(raceLanes[i].v));
    lane.ball.appendChild(streak);
    // 尘团：左右各一，垫在球后面
    const dust = [0, 1].map(() => {
      const puff = document.createElement('i');
      puff.className = 'race-dust';
      lane.drop.prepend(puff);
      return puff;
    });
    return { streak, dust };
  });
  const moving = lanes.flatMap((l, i) => [l.ball, l.fill, l.body, l.ground, fx[i].streak, ...fx[i].dust]);

  function run(): void {
    race.classList.remove('is-waiting');
    gsap.killTweensOf(moving);
    gsap.set(moving, { clearProps: 'transform,opacity' }); // 清掉被打断的上一场留下的变换
    lanes.forEach(({ drop, ball, body, face, ground, read, fill }, i) => {
      const { d, v, kmh } = raceLanes[i];
      const { streak, dust } = fx[i];
      const heft = d / heaviest; // 0–1：个头越大，挤压越深、回弹越慢、尘土越多
      const size = ball.offsetHeight;
      const dist = drop.clientHeight - size;
      const duration = 1.2 * (fastest / v); // 用时 ∝ 1/速度

      // 落地（挂在球的 tween 上：重赛时 kill 掉球的 tween，这一串也就不会发生）
      const land = (): void => {
        gsap.set(streak, { clearProps: 'transform,opacity' });
        face?.setExpression(d > 4 ? 'dizzy' : 'happy'); // 大个的摔晕，小个的松口气
        pop(read);
        const settle = 0.38 + 0.3 * heft;
        const squash = 0.07 + 0.17 * heft;
        gsap
          .timeline()
          .to(body, { scaleX: 1 + squash * 0.8, scaleY: 1 - squash, duration: 0.08, ease: EASE.soft })
          .to(body, { scaleX: 1, scaleY: 1, duration: settle, ease: EASE.bouncy, clearProps: 'transform' });
        // 地面线：上沿不动（球始终贴着它），往下鼓一下再弹回
        gsap.fromTo(
          ground,
          { scaleY: 1.4 + 1.6 * heft },
          { scaleY: 1, duration: settle, ease: EASE.bouncy, clearProps: 'transform' },
        );
        const edge = drop.clientWidth / 2 - dust[0].offsetWidth / 2; // 尘团不出落区
        const reach = Math.min(size * 0.5 + 6 + 8 * heft, edge);
        dust.forEach((puff, j) => {
          const dir = j ? 1 : -1;
          gsap.fromTo(
            puff,
            { x: dir * Math.min(size * 0.3, reach), y: 0, scale: 0.4, opacity: 0.75 },
            {
              x: dir * reach,
              y: -(3 + 7 * heft),
              scale: 1,
              opacity: 0,
              duration: DUR.quick + 0.2 * heft,
              ease: EASE.soft,
              clearProps: 'transform,opacity',
            },
          );
        });
      };

      face?.setExpression('scared');
      gsap.fromTo(ball, { y: -dist }, { y: 0, duration, ease: EASE.fall, clearProps: 'transform', onComplete: land });
      // 速度线与球用同一条缓动：线长 = 上限 × 进度 ≤ 已下落距离（上限 < 落差），不会伸到起点以上
      gsap.fromTo(streak, { scaleY: 0, opacity: 0.85 }, { scaleY: 1, duration, ease: EASE.fall, clearProps: 'transform,opacity' });
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        { scaleX: kmh / GAUGE_MAX_KMH, duration, ease: EASE.soft, clearProps: 'transform' },
      );
      rollNumber(read, kmh, { duration });
    });
  }

  // 开跑前：球停在赛道顶、读数归零（CSS 的 .is-waiting）
  race.classList.add('is-waiting');
  for (const { read } of lanes) read.textContent = '0';
  ScrollTrigger.create({ trigger: race, start: 'top 65%', once: true, onEnter: run });
  section.querySelector<HTMLButtonElement>('.race-replay')!.addEventListener('click', run);

  // ---------- 主菜的延续：曲线一次性描出，四个点依次落下，落到位时弹一下 ----------
  const clip = section.querySelector<SVGRectElement>('#vchart-clip rect')!;
  const fullWidth = clip.width.baseVal.value;
  const tl = gsap
    .timeline({ scrollTrigger: { trigger: chart, start: 'top 70%', once: true } })
    .fromTo(clip, { attr: { width: 0 } }, { attr: { width: fullWidth }, duration: 1.4, ease: EASE.inOut });
  dots.forEach((dot, i) => {
    const at = 1.25 + i * 0.22;
    tl.fromTo(
      dot,
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: EASE.fall, clearProps: 'transform,opacity' },
      at,
    ).fromTo(
      dot.querySelector('.vdot-mark'),
      { scaleX: 1.3, scaleY: 0.7 },
      { scaleX: 1, scaleY: 1, duration: DUR.quick, ease: EASE.bouncy, clearProps: 'transform', immediateRender: false },
      at + 0.4,
    );
  });
}
