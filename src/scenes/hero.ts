import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';

export function initHero(section: HTMLElement): void {
  // 背景粒子（轻量冰雹雨），仅在 hero 可见时运行
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  section.prepend(canvas);
  const field = new ParticleField(canvas, particleCap);

  if (!reducedMotion) {
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
  }

  // 雹宝砸场
  const mascot = createMascot(110, 'scared');
  section.querySelector('.hero-mascot-slot')!.appendChild(mascot.el);

  if (reducedMotion) {
    mascot.setExpression('happy');
    return;
  }

  const inner = section.querySelector<HTMLElement>('.hero-inner')!;
  const cards = section.querySelectorAll('.num-card');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(section.querySelector('.hero-title'), { y: -120, opacity: 0, duration: 0.7 })
    .from(mascot.el, { y: -400, duration: 0.6, ease: 'bounce.out' }, '-=0.3')
    // 落地挤压回弹
    .to(mascot.el, { scaleY: 0.8, scaleX: 1.15, transformOrigin: '50% 100%', duration: 0.1 })
    .to(mascot.el, { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'back.out(3)' })
    .add(() => mascot.setExpression('happy'))
    .from(cards, { y: 60, opacity: 0, scale: 0.85, stagger: 0.15, duration: 0.5 }, '-=0.1')
    .from(section.querySelector('.scroll-hint'), { opacity: 0, duration: 0.6 });

  // 滚动离场视差
  gsap.to(inner, {
    opacity: 0,
    y: -80,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 40%', scrub: true },
  });
}
