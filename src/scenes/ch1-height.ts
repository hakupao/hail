import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CH1_PIN_ID, setStage } from '../journey/journey';
import { createMascot } from '../mascot/mascot';
import type { Expression } from '../mascot/mascot';
import { EASE, observeInView, reducedMotion } from '../utils/motion';

gsap.registerPlugin(MotionPathPlugin);

// 时间线各段的时长（相对单位，scrub 下只有比例有意义）
const HOLD = 1.2; // 开头停在第 1 步
const FADE = 0.2; // 文字切换：淡出、淡入各一段
const LAP = 1.6; // 翻滚一圈
const GROW = 0.4; // 每圈末尾：雹胚长大一级、洋葱多一环
const MELT_FALL = 0.5;
const MELT_MORPH = 0.15;
const TAIL = 0.6; // 结尾停在最终状态
const EMBRYO_R = 7; // 雹胚初始半径（viewBox 单位）；终值取静态图里画的满尺寸
const BURST_SPARKS = 6; // 每长大一级闪的那一圈冰晶的颗数

/** 贴在某个 SVG 图形上的小脸：HTML 叠加层里的一个零尺寸锚点，每次时间线更新时对到图形的圆心上 */
interface Rider {
  el: HTMLElement;
  target: SVGGraphicsElement;
  /** 圆心（图形自己的用户坐标） */
  cx: number;
  cy: number;
  /** 当前半径（用户单位） */
  r: () => number;
  /** 当前应有的不透明度（跟着图形自己和它所在的组） */
  alpha: () => number;
}

// 第一章（v2 规格 §4）：全站唯一的 pin 场景。主菜是「翻滚生长」——雹胚沿闭合轨迹转四圈，
// 每圈长大一级、洋葱剖面多一环；左栏文字随时间线分四步切换。
// v3：雹胚和融化演示的小雹子、水滴各贴一张小脸；云团呼吸、上升气流流动是独立的 CSS 循环。
export function initCh1(section: HTMLElement): void {
  if (reducedMotion) {
    // 静态骨架本身完整可读（四步文字 + 完整的图）；高度尺上的主角在本章直接是满尺寸
    setStage('grow', 1);
    return;
  }

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.ch1-step'));
  const fig = section.querySelector<HTMLElement>('.ch1-fig')!;
  const svg = section.querySelector<SVGSVGElement>('.ch1-svg')!;
  const orbit = section.querySelector<SVGPathElement>('.ch1-orbit')!;
  const embryo = section.querySelector<SVGCircleElement>('.ch1-embryo')!;
  // 洋葱环在 DOM 里是外环在前（先画的在下面），翻滚时由内向外点亮
  const rings = Array.from(section.querySelectorAll<SVGCircleElement>('.ch1-ring')).reverse();
  const core = section.querySelector<SVGCircleElement>('.ch1-core')!;
  const melt = section.querySelector<SVGGElement>('.ch1-melt')!;
  const meltHail = section.querySelector<SVGCircleElement>('.ch1-melt-hail')!;
  const meltDrop = section.querySelector<SVGPathElement>('.ch1-melt-drop')!;
  const zeroLine = section.querySelector<SVGPathElement>('.ch1-zero')!;

  const laps = rings.length;
  const fullR = embryo.r.baseVal.value;
  const radius = (lap: number): number => EMBRYO_R + ((fullR - EMBRYO_R) * lap) / laps;
  const ringR = (i: number): number => (i < 0 ? core : rings[i]).r.baseVal.value;
  const cx = core.cx.baseVal.value;
  const cy = core.cy.baseVal.value;

  // 融化演示的位移从图里量：小雹子落到 0℃ 线为止，水滴从 0℃ 线出发落到它画好的位置
  const zeroY = zeroLine.getBBox().y;
  const hailToLine = zeroY - meltHail.cy.baseVal.value;
  const dropBox = meltDrop.getBBox();
  const dropFromLine = dropBox.y - zeroY; // v2 这里减反了（水滴是从下面升上来的），v3 改正：从 0℃ 线往下落

  // ---------- 独立的 CSS 循环（读者停下不滚时也在动；离屏暂停） ----------
  // 类由 JS 加：无 JS / reduced-motion / init 抛错时这些图形就是静止的原图
  observeInView(section);
  // 云体两侧的云团极慢地「呼吸」（只放大不缩小，不会在云团之间露缝）
  section.querySelectorAll('.ch1-cloud circle').forEach((c) => c.classList.add('ch1-puff', 'anim-loop'));
  // 上升气流的虚线持续向上流
  section.querySelectorAll('.ch1-updraft path:nth-child(odd)').forEach((p) => p.classList.add('ch1-flow', 'anim-loop'));

  // ---------- 小脸 ----------
  // 雹胚是 SVG 里被 MotionPath 驱动的圆，不动它；脸放在图上方的 HTML 叠加层里，由 place() 对位。
  const riders: Rider[] = [];
  const opacityOf = (el: Element): number => Number(gsap.getProperty(el, 'opacity'));
  const addFace = (
    name: string,
    expression: Expression,
    idle: boolean,
    spec: Omit<Rider, 'el'>,
  ): { el: HTMLElement; face: ReturnType<typeof createMascot> } => {
    const el = document.createElement('div');
    el.className = `ch1-rider ch1-rider-${name}`;
    el.setAttribute('aria-hidden', 'true');
    const face = createMascot(0, expression, { bare: true, idle });
    face.el.style.width = face.el.style.height = ''; // 尺寸交给 ch1.css（跟着 --d 走）
    el.appendChild(face.el);
    fig.appendChild(el);
    riders.push({ el, ...spec });
    return { el, face };
  };

  const rider = addFace('embryo', 'happy', true, {
    target: embryo,
    cx: embryo.cx.baseVal.value,
    cy: embryo.cy.baseVal.value,
    r: () => embryo.r.baseVal.value,
    alpha: () => 1,
  });
  addFace('hail', 'scared', false, {
    target: meltHail,
    cx: meltHail.cx.baseVal.value,
    cy: meltHail.cy.baseVal.value,
    r: () => meltHail.r.baseVal.value,
    alpha: () => opacityOf(melt) * opacityOf(meltHail),
  });
  // 水滴的脸贴在它圆鼓鼓的下半截上
  addFace('drop', 'sleepy', false, {
    target: meltDrop,
    cx: dropBox.x + dropBox.width / 2,
    cy: dropBox.y + dropBox.height - dropBox.width / 2,
    r: () => dropBox.width / 2,
    alpha: () => opacityOf(melt) * opacityOf(meltDrop),
  });

  // 每长大一级闪的一圈冰晶：挂在雹胚的锚点上（跟着它走），排在脸的下面
  const burst = document.createElement('div');
  burst.className = 'ch1-burst';
  burst.innerHTML = Array.from(
    { length: BURST_SPARKS },
    (_, i) => `<i style="--a:${(360 / BURST_SPARKS) * i}deg"></i>`,
  ).join('');
  rider.el.prepend(burst);

  // 「啵」：小雹子过 0℃ 线变成水滴的那一下，从线上荡开的一圈
  const plop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  plop.setAttribute('class', 'ch1-melt-plop');
  plop.setAttribute('cx', String(meltHail.cx.baseVal.value));
  plop.setAttribute('cy', String(zeroY));
  plop.setAttribute('r', String(meltHail.r.baseVal.value));
  melt.insertBefore(plop, meltDrop);

  // 把每张脸对到它的图形上：位置、大小、不透明度都从图形此刻的状态现算（先读完再写）
  function place(): void {
    const origin = fig.getBoundingClientRect();
    const reads = riders.map((rd) => {
      const m = rd.target.getScreenCTM();
      return m && {
        x: m.a * rd.cx + m.c * rd.cy + m.e - origin.left,
        y: m.b * rd.cx + m.d * rd.cy + m.f - origin.top,
        d: 2 * rd.r() * Math.hypot(m.a, m.b),
        alpha: rd.alpha(),
      };
    });
    reads.forEach((v, i) => {
      if (!v) return;
      const { style } = riders[i].el;
      style.transform = `translate(${v.x.toFixed(2)}px, ${v.y.toFixed(2)}px)`;
      style.setProperty('--d', `${v.d.toFixed(2)}px`);
      style.opacity = v.alpha.toFixed(3);
    });
  }

  // 初始状态只在这里设一次，时间线里全部用 .to —— scrub 往回滚时能原路退回
  gsap.set(steps.slice(1), { opacity: 0 });
  gsap.set(embryo, { attr: { r: EMBRYO_R } });
  rings.forEach((ring, i) => {
    gsap.set(ring, { opacity: 0, scale: ringR(i - 1) / ringR(i), svgOrigin: `${cx} ${cy}` });
  });
  gsap.set(melt, { opacity: 0 });
  gsap.set(meltDrop, { opacity: 0, y: -dropFromLine, scale: 0.3, transformOrigin: '50% 65%' });
  gsap.set(plop, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
  gsap.set(burst, { opacity: 0 });

  // 翻滚段在时间线上的起止时间，用来把翻滚进度发布给旅程层
  const lapsStart = HOLD + FADE * 2;
  const lapsEnd = lapsStart + LAP * laps;

  // 表情和「长到第几级」都是时间线当前时间的函数（不是一次性回调）：往回滚时原路退回
  let level = -1;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: () => {
      const lapT = tl.time() - lapsStart;
      // 从时间线当前时间算进度，scrub 反向时高度尺上的主角能缩回去
      setStage('grow', lapT / (lapsEnd - lapsStart));

      // 翻滚时头晕；每圈末尾长大的那一段睁大眼；四圈之外是平常的笑脸
      const tumbling = lapT > 0 && lapT < LAP * laps;
      rider.face.setExpression(!tumbling ? 'happy' : lapT % LAP < LAP - GROW ? 'dizzy' : 'wow');
      // 往前滚、刚好长大一级的那一下 pop（唯一的一次性动作，播完自动复位）；首次渲染和往回滚不播
      const now = Math.min(laps, Math.max(0, Math.floor((lapT + GROW) / LAP)));
      if (level >= 0 && now === level + 1) rider.face.react('pop');
      level = now;

      place();
    },
    scrollTrigger: {
      id: CH1_PIN_ID, // 旅程层按这个 id 读 pin 的 start/end（9.5 km → 5.5 km）
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 3)}`,
      scrub: 0.5,
      pin: true,
    },
  });

  const switchStep = (to: number, at: number): void => {
    tl.to(steps[to - 1], { opacity: 0, duration: FADE }, at).to(steps[to], { opacity: 1, duration: FADE }, at + FADE);
  };

  // 第 1 步 → 第 2 步
  switchStep(1, HOLD);

  // 四圈翻滚：四圈等长、首尾相接（旅程层按 floor(progress × 4) 给主角分级），每圈末尾长大一级
  tl.to(
    embryo,
    { motionPath: { path: orbit, align: orbit, alignOrigin: [0.5, 0.5], start: 0, end: laps }, duration: LAP * laps },
    lapsStart,
  );
  rings.forEach((ring, i) => {
    const lapAt = lapsStart + LAP * i;
    const at = lapAt + LAP - GROW;
    // 脸跟着翻一个跟头，赶在长大之前转正
    tl.to(rider.face.el, { rotation: -360 * (i + 1), duration: LAP - GROW, ease: EASE.inOut }, lapAt);
    // 长大一级 + 洋葱多一环，都带一点回弹（环的不透明度保持线性：环数按它判定）
    tl.to(embryo, { attr: { r: radius(i + 1) }, duration: GROW, ease: EASE.spring }, at)
      .to(ring, { opacity: 1, duration: GROW }, at)
      .to(ring, { scale: 1, duration: GROW, ease: EASE.spring }, at);
    // 冰晶从雹胚边缘闪出、散开、淡掉
    tl.fromTo(
      burst,
      { scale: 0.6, rotation: 0 },
      { scale: 1.3, rotation: 30, duration: GROW, ease: EASE.soft, immediateRender: false },
      at,
    )
      .to(burst, { opacity: 1, duration: GROW * 0.25 }, at)
      .to(burst, { opacity: 0, duration: GROW * 0.45 }, at + GROW * 0.55);
  });
  // 第 2 步 → 第 3 步：后两圈开始时
  switchStep(2, lapsStart + LAP * 2);

  // 第 4 步 · 融化伏笔：小雹子落过 0℃ 线变成水滴
  switchStep(3, lapsEnd);
  const meltAt = lapsEnd + FADE * 2;
  const morphAt = meltAt + MELT_FALL;
  tl.to(melt, { opacity: 1, duration: FADE }, meltAt - FADE)
    .to(meltHail, { y: hailToLine, duration: MELT_FALL, ease: EASE.fall }, meltAt)
    .to(meltHail, { opacity: 0, duration: MELT_MORPH }, morphAt)
    .to(meltDrop, { opacity: 1, duration: MELT_MORPH }, morphAt)
    .to(meltDrop, { y: 0, duration: MELT_FALL, ease: EASE.fall }, morphAt + MELT_MORPH)
    .to({}, { duration: TAIL });
  // 「啵」：水滴弹出来，0℃ 线上荡开一圈（都落在上面这几段之内，不改变时间线总长）
  tl.to(meltDrop, { scale: 1, duration: MELT_MORPH * 2.4, ease: EASE.spring }, morphAt)
    .to(plop, { opacity: 1, duration: MELT_MORPH * 0.4 }, morphAt)
    .to(plop, { scale: 2, duration: MELT_MORPH * 2.4, ease: EASE.soft }, morphAt)
    .to(plop, { opacity: 0, duration: MELT_MORPH * 1.4 }, morphAt + MELT_MORPH);

  // 图的尺寸变了（resize、跨断点、字体就绪后重排）：时间线不一定会更新，脸要自己重新对位
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(place).observe(svg);
  place();
}
