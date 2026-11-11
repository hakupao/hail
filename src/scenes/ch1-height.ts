import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CH1_PIN_ID, setStage } from '../journey/journey';
import { reducedMotion } from '../utils/motion';

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

// 第一章（v2 规格 §4）：全站唯一的 pin 场景。主菜是「翻滚生长」——雹胚沿闭合轨迹转四圈，
// 每圈长大一级、洋葱剖面多一环；左栏文字随时间线分四步切换。其余元素静止。
export function initCh1(section: HTMLElement): void {
  if (reducedMotion) {
    // 静态骨架本身完整可读（四步文字 + 完整的图）；高度尺上的主角在本章直接是满尺寸
    setStage('grow', 1);
    return;
  }

  const steps = Array.from(section.querySelectorAll<HTMLElement>('.ch1-step'));
  const orbit = section.querySelector<SVGPathElement>('.ch1-orbit')!;
  const embryo = section.querySelector<SVGCircleElement>('.ch1-embryo')!;
  // 洋葱环在 DOM 里是外环在前（先画的在下面），翻滚时由内向外点亮
  const rings = Array.from(section.querySelectorAll<SVGCircleElement>('.ch1-ring')).reverse();
  const core = section.querySelector<SVGCircleElement>('.ch1-core')!;
  const melt = section.querySelector<SVGGElement>('.ch1-melt')!;
  const meltHail = section.querySelector<SVGCircleElement>('.ch1-melt-hail')!;
  const meltDrop = section.querySelector<SVGPathElement>('.ch1-melt-drop')!;
  const zeroLine = section.querySelector<SVGPathElement>('.ch1-zero')!;
  const updraft = section.querySelectorAll<SVGPathElement>('.ch1-updraft path:nth-child(odd)');

  const laps = rings.length;
  const fullR = embryo.r.baseVal.value;
  const radius = (lap: number): number => EMBRYO_R + ((fullR - EMBRYO_R) * lap) / laps;
  const ringR = (i: number): number => (i < 0 ? core : rings[i]).r.baseVal.value;
  const cx = core.cx.baseVal.value;
  const cy = core.cy.baseVal.value;

  // 融化演示的位移从图里量：小雹子落到 0℃ 线为止，水滴从 0℃ 线出发落到它画好的位置
  const zeroY = zeroLine.getBBox().y;
  const hailToLine = zeroY - meltHail.cy.baseVal.value;
  const dropFromLine = zeroY - meltDrop.getBBox().y;

  // 初始状态只在这里设一次，时间线里全部用 .to —— scrub 往回滚时能原路退回
  gsap.set(steps.slice(1), { opacity: 0 });
  gsap.set(embryo, { attr: { r: EMBRYO_R } });
  rings.forEach((ring, i) => {
    gsap.set(ring, { opacity: 0, scale: ringR(i - 1) / ringR(i), svgOrigin: `${cx} ${cy}` });
  });
  gsap.set(melt, { opacity: 0 });
  gsap.set(meltDrop, { opacity: 0, y: -dropFromLine });

  // 翻滚段在时间线上的起止时间，用来把翻滚进度发布给旅程层
  const lapsStart = HOLD + FADE * 2;
  const lapsEnd = lapsStart + LAP * laps;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    // 从时间线当前时间算进度（而不是一次性回调），scrub 反向时高度尺上的主角能缩回去
    onUpdate: () => setStage('grow', (tl.time() - lapsStart) / (lapsEnd - lapsStart)),
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
    const at = lapsStart + LAP * (i + 1) - GROW;
    tl.to(embryo, { attr: { r: radius(i + 1) }, duration: GROW }, at).to(
      ring,
      { opacity: 1, scale: 1, duration: GROW },
      at,
    );
  });
  // 第 2 步 → 第 3 步：后两圈开始时
  switchStep(2, lapsStart + LAP * 2);

  // 第 4 步 · 融化伏笔：小雹子落过 0℃ 线变成水滴
  switchStep(3, lapsEnd);
  const meltAt = lapsEnd + FADE * 2;
  tl.to(melt, { opacity: 1, duration: FADE }, meltAt - FADE)
    .to(meltHail, { y: hailToLine, duration: MELT_FALL, ease: 'power1.in' }, meltAt)
    .to(meltHail, { opacity: 0, duration: MELT_MORPH }, meltAt + MELT_FALL)
    .to(meltDrop, { opacity: 1, duration: MELT_MORPH }, meltAt + MELT_FALL)
    .to(meltDrop, { y: 0, duration: MELT_FALL }, meltAt + MELT_FALL + MELT_MORPH)
    .to({}, { duration: TAIL });

  // 上升气流的虚线随滚动向上流（跟着同一条时间线走，不是独立循环）
  tl.to(updraft, { strokeDashoffset: -210, duration: tl.duration() }, 0);
}
