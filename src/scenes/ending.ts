import { gsap } from 'gsap';
import { createMascot } from '../mascot/mascot';
import { reducedMotion } from '../utils/motion';

export function initEnding(section: HTMLElement): void {
  const mascot = createMascot(120, 'happy');
  section.querySelector('.ending-mascot-slot')!.appendChild(mascot.el);
  const puddle = section.querySelector<HTMLElement>('.puddle')!;

  if (reducedMotion) return;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 60%' },
  });

  tl.from(mascot.el, { y: -260, duration: 0.9, ease: 'bounce.out' })
    // 安全落地，慢慢融化成水洼
    .to(mascot.el, {
      scaleY: 0.22,
      scaleX: 1.35,
      opacity: 0.55,
      transformOrigin: '50% 100%',
      delay: 0.6,
      duration: 1.8,
      ease: 'power2.inOut',
    })
    .from(puddle, { scaleX: 0, transformOrigin: '50% 50%', duration: 1.8 }, '<')
    .from(
      section.querySelectorAll('.recap .num-card'),
      { y: 50, opacity: 0, stagger: 0.15, duration: 0.5 },
      '-=0.6',
    );
}
