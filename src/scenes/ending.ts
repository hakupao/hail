import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getHailRect, setStage } from '../journey/journey';
import { createMascot } from '../mascot/mascot';
import { EASE, observeInView, reducedMotion } from '../utils/motion';

const HOP_LIFT = 150; // 跳离高度尺时比起点再高出多少（px）；上方有文字时会收小
const HOP_MIN_LIFT = 40;
const HOLD = 0.34; // 起跳前在原位停一下，盖住尺上主角 0.3s 的淡出，交棒时看不到两个雹宝
const HOP_TIME = 1.1; // 从离开高度尺到触地（s）
// 距页面底多少 px 以内算「到底」。上限由读数定：390×844 下距底 60px 以内尺上读数才是 0.0 km（64px 处还是 0.1）。
// 56px 能吸收 innerHeight 滞后一个 Chrome 地址栏（约 56px）的误差；更大的偏差靠「现算」本身和文件末尾的兜底
const NEAR_BOTTOM = 56;

// 「到没到底」「草地还在不在视口里」都在事件里现算，不用 ScrollTrigger 的 start/end：
// 那是 refresh 时按当时 innerHeight 缓存的绝对滚动值，而触屏设备上地址栏伸缩（只改高度的 resize）不触发 refresh，
// 地址栏一动缓存就过期——页面变矮后滚到底也够不着旧的 start。旅程层的 relayout 处理的是同一件事。
function onViewportChange(check: () => void): void {
  // 攒到下一帧再判定：同一个事件里旅程层的监听排在后面，等它先把尺上主角挪到位，交棒时才对得齐
  let queued = false;
  const run = (): void => {
    queued = false;
    check();
  };
  const queue = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  window.visualViewport?.addEventListener('resize', queue);
  // 首次判定也走这里：main.ts 在旅程层建好之后才 refresh，那时 getHailRect() 已可用
  ScrollTrigger.addEventListener('refresh', queue);
}

// 结尾（v2 规格 §4）：高度尺上的主角跳下来落到草地上，融化成带笑脸的水洼。
// 静态 HTML 就是终态（水洼）；这里只负责交棒和那一段动画。
export function initEnding(section: HTMLElement): void {
  const ground = section.querySelector<HTMLElement>('.ground')!;
  const landing = ground.querySelector<HTMLElement>('.landing')!;

  // reduced-motion：水洼一直在。水洼进入视口就收起尺上的主角（它已经化在草地上了），离开再放回，无动画。
  if (reducedMotion) {
    onViewportChange(() => setStage('landed', landing.getBoundingClientRect().top < window.innerHeight ? 1 : 0));
    return;
  }

  const text = section.querySelector<HTMLElement>('.sources')!;
  const puddle = ground.querySelector<SVGElement>('.puddle')!;
  const face = puddle.querySelector<SVGElement>('.puddle-face')!;
  const sprout = ground.querySelector<SVGElement>('.sprout')!;
  const sproutParts = Array.from(sprout.querySelectorAll<SVGElement>('.sprout-stem, .sprout-leaf'));
  const tufts = Array.from(ground.querySelectorAll<SVGElement>('.tuft'));
  const mascot = createMascot(0, 'happy');
  const hail = mascot.el;
  hail.style.width = hail.style.height = ''; // 尺寸交给 CSS（随断点变化）
  const slot = ground.querySelector<HTMLElement>('.ending-hail')!;
  slot.appendChild(hail);
  gsap.set(hail, { autoAlpha: 0 });

  observeInView(section); // 小云、树、涟漪、小芽的循环：结尾在场才动

  // 任一时刻只有一方持有雹宝：handed 为 true 时在结尾这边，false 时在高度尺上
  let handed = false;
  let anim: gsap.core.Animation | null = null;

  function reset(): void {
    if (!handed) return;
    handed = false;
    anim?.kill();
    anim = null;
    gsap.set(hail, { autoAlpha: 0 });
    gsap.set([puddle, sprout], { opacity: 0 });
    gsap.set(tufts, { rotation: 0, scaleY: 1 });
    mascot.setExpression('happy');
    setStage('landed', 0);
  }

  /** 把雹宝摆到尺上主角此刻的位置和大小上；返回它相对终点（布局原位）的竖直偏移和起点顶边 */
  function alignToRuler(): { dy: number; top: number | null } {
    const to = slot.getBoundingClientRect(); // 槽位与雹宝等高、水平居中，且自身没有 transform
    const size = hail.offsetWidth;
    const from = getHailRect();
    const dx = from ? from.left + from.width / 2 - (to.left + to.width / 2) : 0;
    const dy = from ? from.top + from.height / 2 - (to.top + to.height / 2) : -size * 3;
    gsap.set(hail, { x: dx, y: dy, scale: from ? from.width / size : 0.5 });
    return { dy, top: from ? from.top : null };
  }

  function hop(): void {
    hail.classList.remove('is-coarse'); // 尺上的主角已经淡出：腮红、高光随着长大淡入
    const { dy, top } = alignToRuler();
    // 抛物线：水平匀速，竖直方向先减速上升到顶点、再加速落下，两段时长按 √高度 分配。
    // 顶点不越过上方的文字（移动端文字离地面很近）
    const room = top === null ? HOP_LIFT : top - text.getBoundingClientRect().bottom - 24;
    const apex = Math.min(dy, 0) - Math.max(HOP_MIN_LIFT, Math.min(HOP_LIFT, room));
    const up = Math.sqrt(dy - apex);
    const down = Math.sqrt(-apex);
    const tUp = (HOP_TIME * up) / (up + down);
    mascot.setExpression('scared');

    anim = gsap
      .timeline()
      .to(hail, { x: 0, scale: 1, rotation: -360, duration: HOP_TIME, ease: 'none' }, 0)
      .to(hail, { y: apex, duration: tUp, ease: 'power1.out' }, 0)
      .to(hail, { y: 0, duration: HOP_TIME - tUp, ease: 'power1.in' }, tUp)
      // 触地：以底边为支点挤压回弹；被砸得有点晕，落点前的草丛被压弯再弹回
      .set(hail, { rotation: 0, transformOrigin: '50% 100%' })
      .call(() => mascot.setExpression('dizzy'))
      .addLabel('land')
      .to(hail, { scaleX: 1.2, scaleY: 0.78, duration: 0.09, ease: EASE.soft })
      .to(hail, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' })
      .to(tufts, { rotation: (i) => (i ? 62 : -62), scaleY: 0.8, duration: 0.09, ease: EASE.soft }, 'land')
      .to(tufts, { rotation: 0, scaleY: 1, duration: 1.1, ease: 'elastic.out(1, 0.3)', stagger: 0.05 }, 'land+=0.2')
      .call(() => mascot.setExpression('happy'), undefined, 'land+=0.8')
      // 慢慢融化成水洼（融化的起点按落地时刻定死：上面草丛的回弹比挤压长，不能让它把后面的时间往后推）
      .addLabel('melt', 'land+=1.39')
      .call(() => mascot.setExpression('sleepy'), undefined, 'melt')
      .to(hail, { scaleX: 1.5, scaleY: 0.1, duration: 1.8, ease: EASE.inOut }, 'melt')
      .to(puddle, { opacity: 1, scale: 1, duration: 1.8, ease: EASE.inOut }, 'melt')
      .to(hail, { opacity: 0, duration: 0.7, ease: 'power1.in' }, 'melt+=1.1')
      .to(face, { opacity: 1, duration: 0.5 }, 'melt+=1.5')
      // 收尾：水洼边长出一株小芽——茎先抽出来，两片叶子一先一后弹开
      .set(sprout, { opacity: 1 }, 'melt+=2.2')
      .fromTo(sproutParts[0], { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: EASE.soft, svgOrigin: '14 34' }, 'melt+=2.2')
      .fromTo(
        sproutParts.slice(1),
        { scale: 0 },
        { scale: 1, duration: 0.45, ease: EASE.spring, svgOrigin: '14 16', stagger: 0.14 },
        'melt+=2.55',
      );
  }

  function play(): void {
    if (handed) return;
    handed = true;

    gsap.set(hail, { rotation: 0, opacity: 1, transformOrigin: '50% 50%', autoAlpha: 1 });
    gsap.set(puddle, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' });
    gsap.set(face, { opacity: 0 });
    gsap.set(sprout, { opacity: 0 });
    gsap.set(tufts, { rotation: 0, scaleY: 1, transformOrigin: '50% 100%' });
    hail.classList.add('is-coarse'); // 对齐阶段和尺上的主角一个样（精简版）
    alignToRuler();
    setStage('landed', 1);
    // 起跳前先贴着尺上主角停一下（逐帧对齐，滚动还没停稳也不会错位），等它淡出完再起跳
    anim = gsap.to({}, { duration: HOLD, onUpdate: alignToRuler, onComplete: hop });
  }

  onViewportChange(() => {
    // 滚到页面底才交棒
    if (window.scrollY >= ScrollTrigger.maxScroll(window) - NEAR_BOTTOM) play();
    // 草地整个滚出视口后才收回：读者看不到水洼消失，下次到底可以重播
    else if (ground.getBoundingClientRect().top >= window.innerHeight) reset();
  });

  // 兜底：不依赖上面的滚动量计算。只要落点实实在在整个出现在视口里（浏览器自己判定的可见性），就交棒——
  // 读者停在页面底时，水洼这个终态不会因为「到底」没判出来而永远不出现。正常情况下上面的判定先到，这里是空操作。
  new IntersectionObserver(
    (entries) => {
      if (entries[entries.length - 1].intersectionRatio >= 0.9) play();
    },
    { threshold: 0.9 },
  ).observe(landing);
}
