import { gsap } from 'gsap';
import { reducedMotion } from '../utils/motion';

export function initCh1(section: HTMLElement): void {
  const embryo = section.querySelector<SVGCircleElement>('.embryo')!;
  const rings = Array.from(section.querySelectorAll<SVGCircleElement>('.onion-ring'));
  const meltNote = section.querySelector<HTMLElement>('.melt-note')!;

  if (reducedMotion) return; // 静态骨架本身已完整可读

  // 初始隐藏洋葱环（无 JS 时它们是可见的，所以由 JS 来隐藏而非 CSS）
  gsap.set(rings, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=2400',
      scrub: 0.5,
      pin: true,
    },
  });

  // ① 云体浮现 + 孕育区高亮
  tl.from(section.querySelector('.cloud-body'), {
    scale: 0.6,
    opacity: 0,
    transformOrigin: '50% 80%',
    duration: 1,
  })
    .from(section.querySelector('.growth-zone'), { opacity: 0, duration: 0.5 })
    .from(section.querySelector('.updraft-arrows'), { opacity: 0, y: 30, duration: 0.5 });

  // ② 四次翻滚：托起→下落，同步长大一圈、洋葱剖面点亮一环
  rings.forEach((ring, i) => {
    tl.to(embryo, { y: -90, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { y: 0, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { scale: 1 + (i + 1) * 0.28, transformOrigin: '50% 50%', duration: 0.3 }, '<')
      .to(ring, { opacity: 1, scale: 1, duration: 0.4 }, '<');
  });

  // ③ 融化伏笔：说明浮现，🧊→💧 小同伴抖一下完成"变成水滴"的梗
  tl.from(meltNote, { opacity: 0, y: 40, duration: 0.6 }).from(
    section.querySelector('.melt-demo'),
    { scale: 0, rotation: -20, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' },
  );
}
