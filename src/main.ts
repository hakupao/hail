import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRuler } from './background/ruler';
import { initSky } from './background/sky';
import { initCh1 } from './scenes/ch1-height';
import { initCh2 } from './scenes/ch2-speed';
import { initCh3 } from './scenes/ch3-danger';
import { initCh4 } from './scenes/ch4-lab';
import { initEnding } from './scenes/ending';
import { initHero } from './scenes/hero';

gsap.registerPlugin(ScrollTrigger);

// 六个章节场景：各自独立，缺一个不影响其他
const scenes: Array<[string, (el: HTMLElement) => void]> = [
  ['#hero', initHero],
  ['#ch1', initCh1],
  ['#ch2', initCh2],
  ['#ch3', initCh3],
  ['#ch4', initCh4],
  ['#ending', initEnding],
];

for (const [sel, init] of scenes) {
  const el = document.querySelector<HTMLElement>(sel);
  if (el) init(el);
}

// 背景贯穿层必须在各章之后创建：ScrollTrigger 按创建顺序刷新，
// 先建的话 end:'bottom bottom' 会在 ch1 的 pin 撑高文档之前测量，少算 2400px（天空/高度尺提前走完）
initSky();
initRuler();

ScrollTrigger.refresh();
