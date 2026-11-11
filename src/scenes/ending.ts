import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getHailRect, setStage } from '../journey/journey';
import { createMascot } from '../mascot/mascot';
import { reducedMotion } from '../utils/motion';

const HOP_LIFT = 150; // 跳离高度尺时比起点再高出多少（px）
const HOP_TIME = 1.1; // 从离开高度尺到触地（s）
const NEAR_BOTTOM = 12; // 距页面底多少 px 以内算「到底」：此时尺上读数已是 0.0 km

// 结尾（v2 规格 §4）：高度尺上的主角跳下来落到草地上，融化成带笑脸的水洼。
// 静态 HTML 就是终态（水洼）；这里只负责交棒和那一段动画。
export function initEnding(section: HTMLElement): void {
  const ground = section.querySelector<HTMLElement>('.ground')!;

  // reduced-motion：水洼一直在。水洼进入视口就收起尺上的主角（它已经化在草地上了），离开再放回，无动画。
  if (reducedMotion) {
    ScrollTrigger.create({
      trigger: ground.querySelector('.landing'),
      start: 'top bottom',
      onToggle: (self) => setStage('landed', self.isActive ? 1 : 0),
    });
    return;
  }

  const puddle = ground.querySelector<SVGElement>('.puddle')!;
  const face = puddle.querySelector<SVGElement>('.puddle-face')!;
  const mascot = createMascot(0, 'happy');
  const hail = mascot.el;
  hail.style.width = hail.style.height = ''; // 尺寸交给 CSS（随断点变化）
  ground.querySelector('.ending-hail')!.appendChild(hail);
  gsap.set(hail, { autoAlpha: 0 });

  // 任一时刻只有一方持有雹宝：handed 为 true 时在结尾这边，false 时在高度尺上
  let handed = false;
  let tl: gsap.core.Timeline | null = null;

  function reset(): void {
    if (!handed) return;
    handed = false;
    tl?.kill();
    tl = null;
    gsap.set(hail, { autoAlpha: 0 });
    gsap.set(puddle, { opacity: 0 });
    mascot.setExpression('happy');
    setStage('landed', 0);
  }

  function play(): void {
    if (handed) return;
    handed = true;

    // 每次播放都重新量：终点是雹宝在布局里的原位，起点是尺上主角此刻的矩形
    gsap.set(hail, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, transformOrigin: '50% 50%' });
    const to = hail.getBoundingClientRect();
    const from = getHailRect();
    const dx = from ? from.left + from.width / 2 - (to.left + to.width / 2) : 0;
    const dy = from ? from.top + from.height / 2 - (to.top + to.height / 2) : -to.height * 3;
    const scale = from ? from.width / to.width : 0.5;
    // 抛物线：水平匀速，竖直方向先减速上升到顶点、再加速落下，两段时长按 √高度 分配
    const apex = Math.min(dy, 0) - HOP_LIFT;
    const up = Math.sqrt(dy - apex);
    const down = Math.sqrt(-apex);
    const tUp = (HOP_TIME * up) / (up + down);

    gsap.set(hail, { x: dx, y: dy, scale, autoAlpha: 1 });
    gsap.set(puddle, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' });
    gsap.set(face, { opacity: 0 });
    mascot.setExpression('scared');
    setStage('landed', 1);

    tl = gsap
      .timeline()
      .to(hail, { x: 0, scale: 1, rotation: -360, duration: HOP_TIME, ease: 'none' }, 0)
      .to(hail, { y: apex, duration: tUp, ease: 'power1.out' }, 0)
      .to(hail, { y: 0, duration: HOP_TIME - tUp, ease: 'power1.in' }, tUp)
      // 触地：以底边为支点挤压回弹
      .set(hail, { rotation: 0, transformOrigin: '50% 100%' })
      .call(() => mascot.setExpression('happy'))
      .to(hail, { scaleX: 1.2, scaleY: 0.78, duration: 0.09, ease: 'power2.out' })
      .to(hail, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' })
      // 慢慢融化成水洼
      .addLabel('melt', '+=0.7')
      .to(hail, { scaleX: 1.5, scaleY: 0.1, duration: 1.8, ease: 'power2.inOut' }, 'melt')
      .to(puddle, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.inOut' }, 'melt')
      .to(hail, { opacity: 0, duration: 0.7, ease: 'power1.in' }, 'melt+=1.1')
      .to(face, { opacity: 1, duration: 0.5 }, 'melt+=1.5');
  }

  // 滚到页面底才交棒
  ScrollTrigger.create({ trigger: section, start: `bottom bottom+=${NEAR_BOTTOM}`, onEnter: play });
  // 草地整个滚出视口后才收回：读者看不到水洼消失，下次到底可以重播
  ScrollTrigger.create({ trigger: ground, start: 'top bottom', onLeaveBack: reset });
}
