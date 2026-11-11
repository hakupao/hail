import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';

// Hero（v2 规格 §4）。陪读者一路下落的那颗雹胚属于旅程层（journey.ts），它的入场下落也在那里播。
export function initHero(section: HTMLElement): void {
  // reduced-motion：内容由 CSS 直接呈现（预隐藏只在允许动效时生效），不建粒子画布
  if (reducedMotion) return;

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
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo(section.querySelector('.hero-title'), { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
    .fromTo(
      section.querySelectorAll('.num-card'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.5 },
      '-=0.3',
    )
    .fromTo(section.querySelector('.scroll-hint'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, '+=0.3');

  // 滚动离场
  gsap.to(section.querySelector('.hero-inner'), {
    opacity: 0,
    y: -80,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 40%', scrub: true },
  });
}
