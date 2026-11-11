import { gsap } from 'gsap';
import { CH1_PIN_ID, setStage } from '../journey/journey';
import { reducedMotion } from '../utils/motion';

export function initCh1(section: HTMLElement): void {
  const embryo = section.querySelector<SVGCircleElement>('.embryo')!;
  const rings = Array.from(section.querySelectorAll<SVGCircleElement>('.onion-ring'));
  const meltNote = section.querySelector<HTMLElement>('.melt-note')!;

  if (reducedMotion) return; // 静态骨架本身已完整可读

  // 初始隐藏洋葱环（无 JS 时它们是可见的，所以由 JS 来隐藏而非 CSS）
  gsap.set(rings, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });

  // 翻滚段在时间线上的起止时间（建完时间线后赋值），用来把翻滚进度发布给旅程层
  let lapsStart = 0;
  let lapsEnd = 1;

  const tl = gsap.timeline({
    // 从时间线当前时间算进度（而不是一次性回调），scrub 反向时主角能缩回去
    onUpdate: () => setStage('grow', (tl.time() - lapsStart) / (lapsEnd - lapsStart)),
    scrollTrigger: {
      id: CH1_PIN_ID, // 旅程层按这个 id 读 pin 的 start/end
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
  lapsStart = tl.duration();
  rings.forEach((ring, i) => {
    // 故意不带 scale：雹胚保持上一圈长大后的尺寸（累积生长效果），勿加 scale 重置
    tl.to(embryo, { y: -90, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { y: 0, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { scale: 1 + (i + 1) * 0.28, transformOrigin: '50% 50%', duration: 0.3 }, '<')
      .to(ring, { opacity: 1, scale: 1, duration: 0.4 }, '<');
  });
  lapsEnd = tl.duration();

  // ③ 融化伏笔：说明浮现，🧊→💧 小同伴抖一下完成"变成水滴"的梗
  tl.from(meltNote, { opacity: 0, y: 40, duration: 0.6 }).from(
    section.querySelector('.melt-demo'),
    { scale: 0, rotation: -20, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' },
  );
}
