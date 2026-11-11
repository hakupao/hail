import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { DUR, EASE, reducedMotion } from '../utils/motion';

/** 读数涨到头时放大回弹一下。用独立的 scale 属性：不碰 CSS 里随断点变化的 transform，播完不留内联样式 */
function pop(el: HTMLElement): void {
  el.animate([{ scale: 1 }, { scale: 1.2, offset: 0.35 }, { scale: 1 }], {
    duration: DUR.quick * 1000,
    easing: 'ease-out',
  });
}

// 第三章 · 危险阈值（v2 规格 §4；v3 规格 §3.2 的细节动画）。
// 所有动画的终点都是 HTML/CSS 的静态排版：无 JS、reduced-motion、本章 init 抛错时直接就是终态。
export function initCh3(section: HTMLElement): void {
  // 历史卡里的雹宝（默哀）：这张卡保持肃静，不要待机浮动和眨眼
  const historyMascot = createMascot(84, reducedMotion ? 'solemn' : 'happy', { idle: false });
  section.querySelector('.history-mascot-slot')!.appendChild(historyMascot.el);
  // 安全卡旁的雹宝：读到这里才戴上头盔
  const safetyMascot = createMascot(88, reducedMotion ? 'safety' : 'happy');
  section.querySelector('.safety-mascot-slot')!.appendChild(safetyMascot.el);

  // reduced-motion：实物在位、门槛线完整、动能条的终态宽度与读数就是 HTML/CSS 的默认值
  if (reducedMotion) return;

  // ---------- 尺寸阶梯：四个实物从左侧滚进来，停稳后画出 2 cm 门槛线 ----------
  // 起点、半径都在触发时现量；位移和转角在同一个 tween 里用同一条缓动，所以转过的弧长始终等于走过的距离。
  const ladder = section.querySelector<HTMLElement>('.ladder')!;
  const objs = Array.from(ladder.querySelectorAll<SVGSVGElement>('.rung-obj svg'));
  const line = ladder.querySelector<HTMLElement>('.ladder-line')!;
  gsap.set(objs, { opacity: 0 });
  gsap.set(line, { '--draw': 0 });
  ScrollTrigger.create({
    trigger: ladder,
    start: 'top 75%',
    once: true,
    onEnter() {
      const last = objs.length - 1;
      const boxes = objs.map((svg) => svg.getBoundingClientRect());
      // 四个实物在视口左缘之外排成一列（垒球打头，间隔 8px），同时出发、同一条缓动：
      // 任意时刻相邻两个的间距都在「队列间隔」与「终点间隔」之间，不会追尾。
      let queue = 0;
      const starts = boxes.map(() => 0);
      for (let i = last; i >= 0; i--) {
        starts[i] = boxes[i].right + 8 + queue;
        queue += boxes[i].width + 8;
      }
      objs.forEach((svg, i) => {
        const radius = boxes[i].width / 2;
        const deg = (px: number): number => (px / radius) * (180 / Math.PI);
        const from = starts[i];
        const over = 4 + i * 0.8; // 冲过头一点再滚回来
        const heft = i / last; // 大的更沉：回得慢
        gsap
          .timeline()
          .set(svg, { opacity: 1 })
          .fromTo(svg, { x: -from, rotation: -deg(from) }, { x: over, rotation: deg(over), duration: 1.3, ease: EASE.soft })
          .to(svg, {
            x: 0,
            rotation: 0,
            duration: DUR.quick + 0.25 * heft,
            ease: EASE.inOut,
            clearProps: 'transform,opacity',
          });
      });
      gsap.to(line, { '--draw': 1, duration: DUR.slow, delay: 1.2, ease: EASE.inOut, clearProps: '--draw' });
    },
  });

  // ---------- 主菜：三根动能条在同一把刻度尺上涨起来，涨到头「咚」地一顿 ----------
  // 条的终态宽度由 CSS 按 焦耳数 / 200 给出，这里只用百分比位移把它从左侧揭开（不量像素，resize 安全）。
  const mathRows = section.querySelectorAll<HTMLElement>('.ch3-math .tex-display');
  const rows = Array.from(section.querySelectorAll<HTMLElement>('.energy-row')).map((row, i) => ({
    row,
    joules: Number(row.dataset.joules),
    // 条与读数的「骑手」等宽，一起做同一个百分比位移：读数始终贴着条尾
    moving: Array.from(row.querySelectorAll<HTMLElement>('.energy-fill, .energy-rider')),
    num: row.querySelector<HTMLElement>('.energy-num')!,
    // 职业投手那一行条尾的小棒球
    ball: row.querySelector<HTMLElement>('.energy-ball'),
    // 公式块里的两行代入式（20 J、170 J）与第一、第三根条是同一组数字
    echo: [mathRows[1], undefined, mathRows[2]][i],
  }));
  for (const { row, moving, num } of rows) {
    gsap.set(moving, { x: 0, xPercent: -100 });
    num.textContent = '0 J';
    row.classList.add('is-waiting'); // 小棒球先等在轨道起点（CSS）
  }
  ScrollTrigger.create({
    trigger: section.querySelector('.energy'),
    start: 'top 72%',
    once: true,
    onEnter() {
      rows.forEach(({ row, joules, moving, num, ball, echo }, i) => {
        // 条越长涨得越久，三根条的「涨速」看起来接近
        const duration = 0.7 + joules / 140;
        const delay = i * 0.3;
        const count = { j: 0 };
        const spin = ball?.firstElementChild ?? null;
        const hit = spin ? [...moving, spin] : moving;

        // 涨到头：向回一缩再顶回去（不越过终点，条的左端不会露缝），读数 pop，对应的那行式子亮一下
        const thud = (): void => {
          pop(num);
          if (echo) {
            echo.classList.add('is-lit');
            gsap.delayedCall(DUR.base, () => echo.classList.remove('is-lit'));
          }
          gsap
            .timeline({ onComplete: () => void (spin && gsap.set(spin, { clearProps: 'transform' })) })
            .to(hit, { x: -(2 + joules / 30), duration: 0.07, ease: EASE.soft })
            .to(hit, { x: 0, duration: DUR.quick, ease: EASE.soft });
        };

        gsap.to(moving, { xPercent: 0, duration, delay, ease: EASE.fall, onComplete: thud });
        gsap.to(count, {
          j: joules,
          duration,
          delay,
          ease: EASE.fall,
          onUpdate: () => {
            num.textContent = `${Math.round(count.j)} J`;
          },
        });
        const waitedAt = ball?.offsetLeft ?? 0;
        row.classList.remove('is-waiting');
        if (ball && spin) {
          // 小棒球从轨道起点飞到条尾：路程现量（等待位 → 终点位），转角与路程匹配
          const travel = ball.offsetLeft - waitedAt;
          const turn = (travel / (ball.offsetWidth / 2)) * (180 / Math.PI);
          gsap.fromTo(spin, { x: -travel, rotation: -turn }, { x: 0, rotation: 0, duration, delay, ease: EASE.fall });
        }
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

  // 安全卡：读到这里雹宝戴上头盔，头盔落稳时拍一下
  ScrollTrigger.create({
    trigger: section.querySelector('.safety'),
    start: 'top 75%',
    once: true,
    onEnter() {
      safetyMascot.setExpression('safety');
      gsap.delayedCall(0.25, () => safetyMascot.react('pop'));
    },
  });
}
