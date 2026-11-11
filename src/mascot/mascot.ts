import { observeInView, reducedMotion } from '../utils/motion';

// 雹宝 v2（v3 规格 §2）。
// 结构：.mascot-wrap（尺寸盒，永远不被待机或反应动画移动 / 缩放——外面的 GSAP 位移、测量都作用在它上面）
//        └ .mascot-bob（待机浮动与 react() 都作用在这一层）
//            └ svg（表情各部件叠放，切换时交叉淡入）
// 样式与 keyframes 在 styles/mascot.css。

export type Expression = 'happy' | 'scared' | 'solemn' | 'safety' | 'lab' | 'wow' | 'dizzy' | 'sleepy';

/** 一次性反应：squash 落地挤压回弹 / hop 小跳 / shake 发抖 / pop 放大回弹 */
export type Reaction = 'squash' | 'hop' | 'shake' | 'pop';

export type MascotDetail = 'auto' | 'coarse';

export interface MascotOptions {
  /**
   * 只要脸、不画冰雹身体（圆、描边、高光弧）：用来给别的图形（竞速球、雹胚、水滴…）贴一张小脸。
   * 把返回的 el 放进那个图形里：默认绝对定位铺满最近的定位祖先（宿主要有 position），被测量的那个元素的尺寸不会因此改变。
   * 想要别的位置 / 大小就用自己的 CSS 覆盖（任何选择器都压得过默认值）。bare 模式下 sizePx 不起作用。
   */
  bare?: boolean;
  /** false：不要待机浮动和眨眼（react() 仍可用）。默认 true；之后可用 setIdle() 开关 */
  idle?: boolean;
  /**
   * 'auto'（默认）：按渲染宽度自动判定，44px 及以下画粗线简化版（省掉腮红和高光、线条加粗、旋涡眼换成叉）。
   * 'coarse'：不论多大都画粗线简化版。之后可用 setDetail() 切换
   */
  detail?: MascotDetail;
}

export interface Mascot {
  /** .mascot-wrap：尺寸盒。可以被 GSAP 位移、被测量；不要往它上面加循环动画 */
  el: HTMLDivElement;
  /** 切换表情（嘴形 / 眼睛交叉淡入约 0.18s，安全帽和护目镜弹入）。重复设同一个表情是空操作 */
  setExpression(e: Expression): void;
  /** 播一次反应动画，作用在 .mascot-bob 上，结束后自动复位；播放中再调用会打断并重新开始。reduced-motion 下是空操作 */
  react(kind: Reaction): void;
  /** 运行中开关待机浮动与眨眼（react() 不受影响）。关掉时两者立刻回到静止位；重新打开时从各自的相位接着走 */
  setIdle(on: boolean): void;
  /** 运行中切换画法：'coarse' 强制粗线简化版，'auto' 回到按渲染宽度自动判定。切换是即时的，没有过渡 */
  setDetail(detail: MascotDetail): void;
}

const INK = '#222';

// 视图盒 120×120，身体是圆心 (60,60)、半径 44 的圆。
// data-part 是表情部件；带 .m-fine 的是只在大尺寸下显示的细节（腮红、眼睛高光、内圈高光弧）。
const BODY = `
  <circle cx="60" cy="60" r="44" fill="#eef8ff" stroke="#9fcbe8" stroke-width="5"/>
  <path d="M60 24 a36 36 0 0 1 36 36" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>
  <path class="m-fine" d="M60 36 a24 24 0 0 1 24 24" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>`;

const FACE = `
  <g data-part="blush" class="m-fine" fill="#ffb7c5">
    <ellipse cx="33" cy="67" rx="7.5" ry="4.8"/>
    <ellipse cx="87" cy="67" rx="7.5" ry="4.8"/>
  </g>
  <g class="m-eyes anim-loop">
    <g data-part="eyes-open">
      <circle class="m-eye" cx="46" cy="54" r="5.5" fill="${INK}"/>
      <circle class="m-eye" cx="74" cy="54" r="5.5" fill="${INK}"/>
      <g class="m-fine" fill="#fff">
        <circle cx="48" cy="51.8" r="1.9"/>
        <circle cx="76" cy="51.8" r="1.9"/>
      </g>
    </g>
    <g data-part="eyes-wide">
      <circle class="m-eye" cx="46" cy="53" r="7.5" fill="${INK}"/>
      <circle class="m-eye" cx="74" cy="53" r="7.5" fill="${INK}"/>
      <g class="m-fine" fill="#fff">
        <circle cx="48.6" cy="50" r="2.6"/>
        <circle cx="76.6" cy="50" r="2.6"/>
        <circle cx="43.6" cy="56" r="1.2"/>
        <circle cx="71.6" cy="56" r="1.2"/>
      </g>
    </g>
    <path data-part="eyes-closed" class="m-line" d="M40 54 h12 M68 54 h12" stroke-width="3"/>
    <path data-part="eyes-arc" class="m-line" d="M39.5 52 q6.5 6.5 13 0 M67.5 52 q6.5 6.5 13 0" stroke-width="3.2"/>
    <g data-part="eyes-spiral">
      <path class="m-line m-fine" stroke-width="2.4" d="M46 54 a1.8 1.8 0 0 1 3.6 0 a3.3 3.3 0 0 1 -6.6 0 a4.8 4.8 0 0 1 9.6 0 a6.3 6.3 0 0 1 -12.6 0 M74 54 a1.8 1.8 0 0 1 3.6 0 a3.3 3.3 0 0 1 -6.6 0 a4.8 4.8 0 0 1 9.6 0 a6.3 6.3 0 0 1 -12.6 0"/>
      <path class="m-line m-coarse" stroke-width="3.4" d="M41 49 l10 10 M51 49 l-10 10 M69 49 l10 10 M79 49 l-10 10"/>
    </g>
  </g>
  <path data-part="brows" class="m-line" d="M39 44.5 l11 -3.5 M81 44.5 l-11 -3.5" stroke-width="2.6"/>
  <path data-part="mouth-smile" class="m-line m-mouth" d="M48 74 Q60 84 72 74" stroke-width="4"/>
  <path data-part="mouth-lab" class="m-line m-mouth" d="M48 76 Q60 82 72 76" stroke-width="4"/>
  <path data-part="mouth-line" class="m-line m-mouth" d="M50 78 h20" stroke-width="4"/>
  <path data-part="mouth-o" class="m-line m-mouth" d="M54 76 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0" stroke-width="4"/>
  <g data-part="mouth-wow">
    <ellipse cx="60" cy="77" rx="6.5" ry="8" fill="${INK}"/>
    <ellipse class="m-fine" cx="60" cy="81" rx="3.8" ry="2.8" fill="#ffb7c5"/>
  </g>
  <path data-part="mouth-wavy" class="m-line m-mouth" d="M47 77 q3.25 -5 6.5 0 t6.5 0 t6.5 0 t6.5 0" stroke-width="3.4"/>
  <path data-part="mouth-soft" class="m-line m-mouth" d="M53 76 Q60 81.5 67 76" stroke-width="3.6"/>
  <path data-part="sweat" d="M88 25 C91.5 31 94 34.5 94 38 a6 6 0 0 1 -12 0 C82 34.5 84.5 31 88 25 z" fill="#bfe3ff" stroke="#9fcbe8" stroke-width="2" stroke-linejoin="round"/>
  <g data-part="helmet" class="m-gear">
    <path d="M28 46 a32 32 0 0 1 64 0 z" fill="#ffd84d" stroke="#d9a72e" stroke-width="3"/>
    <rect x="24" y="44" width="72" height="8" rx="4" fill="#d9a72e"/>
  </g>
  <g data-part="goggles" class="m-gear">
    <rect x="36" y="44" width="20" height="16" rx="6" fill="#bfe3ff" fill-opacity="0.55" stroke="${INK}" stroke-width="3"/>
    <rect x="64" y="44" width="20" height="16" rx="6" fill="#bfe3ff" fill-opacity="0.55" stroke="${INK}" stroke-width="3"/>
    <path d="M56 52 h8" stroke="${INK}" stroke-width="3"/>
  </g>`;

/** 每种表情点亮哪些部件。solemn 保持素净：没有腮红 */
const PARTS: Record<Expression, string[]> = {
  happy: ['eyes-open', 'mouth-smile', 'blush'],
  scared: ['eyes-open', 'brows', 'mouth-o', 'sweat'],
  solemn: ['eyes-closed', 'mouth-line'],
  safety: ['eyes-open', 'mouth-smile', 'blush', 'helmet'],
  lab: ['eyes-open', 'mouth-lab', 'blush', 'goggles'],
  wow: ['eyes-wide', 'mouth-wow', 'blush'],
  dizzy: ['eyes-spiral', 'mouth-wavy', 'blush'],
  sleepy: ['eyes-arc', 'mouth-soft', 'blush'],
};

// 反应动画只用 transform；待机用的是独立的 translate / rotate 属性，两者叠加、互不覆盖
const REACTIONS: Record<Reaction, { frames: Keyframe[]; duration: number }> = {
  squash: {
    duration: 620,
    frames: [
      { transform: 'scale(1, 1)', transformOrigin: '50% 100%', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { transform: 'scale(1.24, 0.72)', transformOrigin: '50% 100%', offset: 0.16, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { transform: 'scale(0.9, 1.12)', transformOrigin: '50% 100%', offset: 0.42, easing: 'ease-in-out' },
      { transform: 'scale(1.05, 0.96)', transformOrigin: '50% 100%', offset: 0.68, easing: 'ease-in-out' },
      { transform: 'scale(1, 1)', transformOrigin: '50% 100%' },
    ],
  },
  hop: {
    duration: 560,
    frames: [
      { transform: 'translateY(0) scale(1, 1)', transformOrigin: '50% 100%', easing: 'ease-out' },
      { transform: 'translateY(0) scale(1.1, 0.88)', transformOrigin: '50% 100%', offset: 0.14, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { transform: 'translateY(-30%) scale(0.95, 1.06)', transformOrigin: '50% 100%', offset: 0.48, easing: 'cubic-bezier(0.32, 0, 0.67, 0)' },
      { transform: 'translateY(0) scale(1.12, 0.88)', transformOrigin: '50% 100%', offset: 0.76, easing: 'ease-out' },
      { transform: 'translateY(0) scale(1, 1)', transformOrigin: '50% 100%' },
    ],
  },
  shake: {
    duration: 520,
    frames: [0, -1, 1, -1, 1, -0.6, 0.6, 0].map((k) => ({ transform: `translateX(${k * 5}%) rotate(${k * 4}deg)` })),
  },
  pop: {
    duration: 440,
    frames: [
      { transform: 'scale(1)', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
      { transform: 'scale(1.26)', offset: 0.32, easing: 'ease-in-out' },
      { transform: 'scale(0.95)', offset: 0.66, easing: 'ease-in-out' },
      { transform: 'scale(1)' },
    ],
  },
};

/**
 * @param sizePx 尺寸盒边长（px），写成内联宽高。传 0（或 bare 模式）时不写内联宽高，尺寸交给调用方的 CSS：
 *   尺寸盒自带 1:1 的宽高比，只给宽或只给高也是正方形；非 bare 时宽高都不给则是 0×0。
 * @param expression 初始表情
 */
export function createMascot(sizePx = 96, expression: Expression = 'happy', options: MascotOptions = {}): Mascot {
  const el = document.createElement('div');
  el.className = options.bare ? 'mascot-wrap mascot-bare' : 'mascot-wrap';
  if (!options.bare && sizePx > 0) {
    el.style.width = `${sizePx}px`;
    el.style.height = `${sizePx}px`;
  }
  el.innerHTML = `<div class="mascot-bob anim-loop"><svg viewBox="0 0 120 120" aria-hidden="true">${options.bare ? '' : BODY}${FACE}</svg></div>`;

  const bob = el.firstElementChild as HTMLElement;
  const parts = Array.from(el.querySelectorAll<SVGElement>('[data-part]'));

  let phased = false;
  function setIdle(on: boolean): void {
    el.classList.toggle('mascot-still', !on);
    if (!on || phased) return;
    phased = true;
    // 每个实例错开相位：浮动从周期里的随机位置开始，眨眼间隔 3–5 秒
    el.style.setProperty('--bob-delay', `${(-Math.random() * 3).toFixed(2)}s`);
    el.style.setProperty('--blink-dur', `${(3 + Math.random() * 2).toFixed(2)}s`);
    el.style.setProperty('--blink-delay', `${(-Math.random() * 4).toFixed(2)}s`);
    observeInView(el); // 循环动画「在场才动」（base.css 的 .anim-loop）
  }

  function setDetail(detail: MascotDetail): void {
    el.classList.toggle('mascot-coarse', detail === 'coarse');
  }

  let current: Expression | null = null;
  function setExpression(e: Expression): void {
    if (e === current) return;
    current = e;
    el.dataset.expr = e; // CSS 按它关掉 solemn 的待机、给闭眼类表情停掉眨眼
    const on = PARTS[e];
    for (const p of parts) p.classList.toggle('on', on.includes(p.dataset.part!));
  }

  let running: Animation | null = null;
  function react(kind: Reaction): void {
    if (reducedMotion || typeof bob.animate !== 'function') return;
    running?.cancel();
    const { frames, duration } = REACTIONS[kind];
    const anim = bob.animate(frames, { duration, easing: 'linear' });
    running = anim;
    const clear = (): void => {
      if (running === anim) running = null;
    };
    anim.onfinish = clear;
    anim.oncancel = clear;
  }

  setIdle(options.idle !== false);
  setDetail(options.detail ?? 'auto');
  setExpression(expression);
  return { el, setExpression, react, setIdle, setDetail };
}
