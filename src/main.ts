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

// 告诉 index.html 里的失效保护：模块已经跑起来了
(window as Window & { __hailBooted?: boolean }).__hailBooted = true;

gsap.registerPlugin(ScrollTrigger);

// 六个章节场景：各自独立，缺一个或某一个 init 抛错都不影响其他
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
  if (!el) continue;
  try {
    init(el);
  } catch (e) {
    console.error(`[hail] 场景 ${sel} 初始化失败`, e);
    // 各章 CSS 里「等本章 JS 接管」的预隐藏和 pin 布局都排除带这个标记的章，失败的章退回静态排版
    el.dataset.initFailed = '';
  }
}

// 旅程层在各章之后创建（它的探针另有 refreshPriority:-1 兜底，保证排在所有 pin 之后测量）
try {
  initJourney();
} catch (e) {
  console.error('[hail] 旅程层初始化失败', e);
}

ScrollTrigger.refresh();

// Fredoka 是 swap 加载的，换字后各章高度会变：字体就绪后重新测量一次
void document.fonts.ready.then(() => ScrollTrigger.refresh());
