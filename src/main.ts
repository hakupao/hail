import './styles/tokens.css';
import './styles/base.css';
import './styles/journey.css';
import './styles/hero.css';
import './styles/ch1.css';
import './styles/ch2.css';
import './styles/ch3.css';
import './styles/ch4.css';
import './styles/ending.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initJourney } from './journey/journey';
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

// 旅程层必须在各章之后创建：ScrollTrigger 按创建顺序刷新，
// 量锚点的探针要排在 ch1 的 pin 之后，才能把它撑高文档的那段算进去
initJourney();

ScrollTrigger.refresh();

// Fredoka 是 swap 加载的，换字后各章高度会变：字体就绪后重新测量一次
void document.fonts.ready.then(() => ScrollTrigger.refresh());
