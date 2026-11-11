import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onHailLanded } from '../journey/journey';
import { DUR, EASE, observeInView, particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';

// Hero（v2 规格 §4）。陪读者一路下落的那颗雹胚属于旅程层（journey.ts），它的入场下落也在那里播。
export function initHero(section: HTMLElement): void {
  // reduced-motion：内容由 CSS 直接呈现（预隐藏只在允许动效时生效），不建粒子画布
  if (reducedMotion) return;

  // 滚动提示箭头的浮动是 CSS 循环：只在 Hero 在场时运行
  observeInView(section);

  // 背景粒子（轻量冰雹雨，密度为 v1 的一半），画布在内容层之下，仅在 hero 可见时运行
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  section.prepend(canvas);
  const field = new ParticleField(canvas, particleCap);
  field.setMode('hail-light');
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onEnter: () => field.start(),
    onEnterBack: () => field.start(),
    onLeave: () => field.stop(),
    onLeaveBack: () => field.stop(),
  });
  field.start();

  // 入场：fromTo 写明终值（CSS 在 html.js 下把这些元素预隐藏为 opacity:0）
  const title = section.querySelector<HTMLElement>('.hero-title')!;
  const tl = gsap.timeline({ defaults: { ease: EASE.settle } });
  tl.fromTo(title, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
    .fromTo(
      section.querySelectorAll('.num-card'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.5 },
      '-=0.3',
    )
    .fromTo(section.querySelector('.scroll-hint'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, '+=0.3');

  // 雹胚落到高度尺 10 km 的那一下，标题被轻轻震到：往下一沉再弹回原位。
  // 只是锦上添花：带滚动位置加载等情况下不会触发，标题的显示不依赖它。
  // overwrite 只接管 y：万一入场还没播完，它的 opacity 照常走完
  onHailLanded(() => {
    // 本章 init 后面抛错被撤回时，这个回调仍然会被旅程层调用：那时不碰标题
    if (section.hasAttribute('data-init-failed')) return;
    gsap
      .timeline()
      .to(title, { y: 6, duration: 0.08, ease: EASE.soft, overwrite: 'auto' })
      .to(title, { y: 0, duration: DUR.slow, ease: EASE.bouncy });
  });

  // 滚动离场
  gsap.to(section.querySelector('.hero-inner'), {
    opacity: 0,
    y: -80,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 40%', scrub: true },
  });
}
