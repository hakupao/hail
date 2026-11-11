import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { icon } from '../art/icons';
import { rulerMarks } from '../content';
import { createMascot } from '../mascot/mascot';
import type { Expression } from '../mascot/mascot';
import { reducedMotion } from '../utils/motion';
import { altitudeAt, normalizeAnchors, skyGradient, stageAt, temperatureAt } from './anchors';
import type { Anchor, Stage } from './anchors';

// 旅程层（规格 §2）：文档等高的天空渐变 + 右侧高度尺 + 沿尺子下滑的主角雹宝。
// 场景 → 旅程层 只有 setStage / getHailRect 两个入口；旅程层不 import 任何场景。

const HAIL_BOX = 36; // 主角满尺寸（px）；雹胚是它的一半
const GROW_STEPS = 4; // 第一章翻滚四圈，每圈长大一级
const MOBILE_SCALE = 0.7;
/** 第一章 pin 的 ScrollTrigger id。第一章场景必须用这个常量给它的 pin 命名，旅程层靠它读 pin 的起止位置 */
export const CH1_PIN_ID = 'ch1-pin';

const EXPRESSION: Record<Stage, Expression> = {
  embryo: 'happy',
  grow: 'happy',
  fall: 'scared',
  danger: 'safety',
  lab: 'lab',
  landed: 'happy',
};

/** 场景发布的进度——只有旅程层自己量不出来的两样 */
export type PublishedStage = 'grow' | 'landed';
const published: Record<PublishedStage, number> = { grow: 0, landed: 0 };

let rerender: (() => void) | null = null;
let hailEl: HTMLElement | null = null;

/**
 * 场景 → 旅程层的发布接口。表情/装备由旅程层按高度自己判定，场景不用管；
 * 场景只发布旅程层量不出来的进度（0–1）：
 * - 'grow'：第一章翻滚进度。主角随它从雹胚逐级（四级）长到满尺寸，往回滚会缩回去。
 * - 'landed'：结尾交棒。> 0 时隐藏高度尺上的主角（由结尾场景自己的雹宝接着落地），0 时恢复。
 * 可在 initJourney 之前调用。
 */
export function setStage(stage: PublishedStage, progress: number): void {
  if (!Number.isFinite(progress)) return; // 时间线时长为 0 时会算出 0/0，别让 NaN 进到 --hail-scale
  const p = Math.min(1, Math.max(0, progress));
  if (published[stage] === p) return;
  published[stage] = p;
  rerender?.();
}

/** 高度尺上主角当前的视口矩形（结尾场景做「离开高度尺」时的起点）；旅程层未创建时为 null */
export function getHailRect(): DOMRect | null {
  return hailEl ? hailEl.getBoundingClientRect() : null;
}

function formatTemp(celsius: number): string {
  const t = Math.round(celsius);
  return `${t < 0 ? '−' : ''}${Math.abs(t)}℃`;
}

/** 在所有场景 init 之后调用。探针用 refreshPriority:-1 排到最后刷新，所以之后再新增 pin 也不需要关心创建顺序 */
export function initJourney(): void {
  const app = document.querySelector<HTMLElement>('#app')!;

  // ---------- 高度尺 DOM ----------
  const ruler = document.createElement('aside');
  ruler.id = 'journey-ruler';
  ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = `
    <div class="jr-track">
      <div class="jr-line"></div>
      ${Array.from({ length: 11 }, (_, km) => `<i class="jr-tick" style="top:${(1 - km / 10) * 100}%"></i>`).join('')}
      ${rulerMarks
        .map((m) => `<div class="jr-mark" data-km="${m.km}" style="top:${(1 - m.km / 10) * 100}%">${icon(m.icon, 16)}</div>`)
        .join('')}
      <div class="journey-hail">
        <div class="jr-hail-drop"><div class="jr-hail-body"></div></div>
        <div class="jr-readout">
          <span class="jr-alt-line"><b class="jr-alt">10.0</b><span class="jr-unit">km</span></span>
          <span class="jr-temp"></span>
          <span class="jr-ref"></span>
        </div>
      </div>
    </div>`;
  document.body.appendChild(ruler);

  const track = ruler.querySelector<HTMLElement>('.jr-track')!;
  const hail = ruler.querySelector<HTMLElement>('.journey-hail')!;
  const drop = ruler.querySelector<HTMLElement>('.jr-hail-drop')!;
  const body = ruler.querySelector<HTMLElement>('.jr-hail-body')!;
  const altEl = ruler.querySelector<HTMLElement>('.jr-alt')!;
  const tempEl = ruler.querySelector<HTMLElement>('.jr-temp')!;
  const refEl = ruler.querySelector<HTMLElement>('.jr-ref')!;
  const marks = Array.from(ruler.querySelectorAll<HTMLElement>('.jr-mark'));

  const mascot = createMascot(HAIL_BOX, 'happy');
  body.appendChild(mascot.el);
  hailEl = body;

  // ---------- 锚点探针 ----------
  // 每章一个 start:'top top' 的 ScrollTrigger，读它的 .start：它在第一章 pin 之后刷新，已含 pin spacer。
  const probe = (sel: string): ScrollTrigger | null => {
    const el = document.querySelector<HTMLElement>(sel);
    return el ? ScrollTrigger.create({ trigger: el, start: 'top top', refreshPriority: -1 }) : null;
  };
  const probes = {
    ch1: probe('#ch1'),
    ch2: probe('#ch2'),
    cloudBase: probe('.cloudbase'),
    ch3: probe('#ch3'),
    ch4: probe('#ch4'),
    ending: probe('#ending'),
  };

  let measured: Anchor[] = [];
  let anchors: Anchor[] = normalizeAnchors([], 1);
  let trackH = 0;
  let mobile = false;
  let lastStage: Stage | null = null;

  function measure(): void {
    measured = [];
    const add = (st: ScrollTrigger | null | undefined, km: number, edge: 'start' | 'end' = 'start'): void => {
      if (st) measured.push({ y: st[edge], km });
    };
    const pin = ScrollTrigger.getById(CH1_PIN_ID);
    if (pin) {
      add(pin, 9.5);
      add(pin, 5.5, 'end');
    } else {
      add(probes.ch1, 9.5); // 无 pin（reduced-motion）：第一章顶 9.5，直接线性落到第二章顶 5.0
      if (!reducedMotion && probes.ch1) console.warn(`[journey] 没找到 id 为 ${CH1_PIN_ID} 的 pin，高度读数将与第一章翻滚对不上`);
    }
    add(probes.ch2, 5);
    // 没有云底分界元素时退化为第三章顶
    const cloudBase = probes.cloudBase ?? probes.ch3;
    // +2px：急转藏在分界 SVG 顶部的实色云体之下，避免亚像素取整在分界上缘露出一条亮缝
    const cloudBaseY = cloudBase ? cloudBase.start + 2 : null;
    // 1.5 km 与天空急转钉在同一个 y：天空转亮、读数 1.5、戴上安全帽是同一刻
    if (cloudBaseY !== null) measured.push({ y: cloudBaseY, km: 1.5 });
    add(probes.ch4, 0.4);
    add(probes.ending, 0.1);
    anchors = normalizeAnchors(measured, ScrollTrigger.maxScroll(window));
    if (cloudBaseY !== null) app.style.setProperty('--sky', skyGradient(anchors, cloudBaseY));

    trackH = track.clientHeight;
    mobile = window.matchMedia('(max-width: 768px)').matches;
    render();
  }

  // 触屏设备上 ScrollTrigger 默认忽略「只改高度」的 resize（地址栏伸缩），不会触发 refresh。
  // 但 maxScroll 和轨道高度都变了：不跟着更新的话，滚到页底读数会停在 0.1 km、主角与刻度错位。
  function relayout(): void {
    anchors = normalizeAnchors(measured, ScrollTrigger.maxScroll(window));
    trackH = track.clientHeight;
    render();
  }

  function render(): void {
    const alt = altitudeAt(window.scrollY, anchors);
    hail.style.transform = `translate3d(0, ${((1 - alt / 10) * trackH).toFixed(1)}px, 0)`;

    const altText = alt.toFixed(1);
    if (altEl.textContent !== altText) altEl.textContent = altText;
    const tempText = formatTemp(temperatureAt(alt));
    if (tempEl.textContent !== tempText) tempEl.textContent = tempText;

    let ref = '';
    for (const m of marks) {
      const near = Math.abs(Number(m.dataset.km) - alt) < 0.35;
      m.classList.toggle('active', near);
      if (near) ref = rulerMarks.find((r) => String(r.km) === m.dataset.km)!.label;
    }
    if (refEl.textContent !== ref) refEl.textContent = ref;

    const stage = stageAt(alt);
    if (stage !== lastStage) {
      lastStage = stage;
      mascot.setExpression(EXPRESSION[stage]);
      ruler.dataset.stage = stage;
    }

    // 尺寸：雹胚 18px → 第一章每翻滚一圈长一级 → 36px；过了第一章一定是满尺寸
    // reduced-motion 下第一章没有时间线发布进度，按高度在 9.5 → 5.5 km 之间推算
    const growNow = reducedMotion ? Math.min(1, Math.max(0, (9.5 - alt) / 4)) : published.grow;
    const grown = stage === 'embryo' ? 0 : stage === 'grow' ? growNow : 1;
    const level = Math.floor(grown * GROW_STEPS + 1e-6) / GROW_STEPS;
    body.style.setProperty('--hail-scale', String((0.5 + 0.5 * level) * (mobile ? MOBILE_SCALE : 1)));

    ruler.classList.toggle('is-handed-off', published.landed > 0);
  }

  rerender = render;
  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', relayout, { passive: true });
  window.visualViewport?.addEventListener('resize', relayout);
  // refresh 事件在所有 ScrollTrigger（含探针）重新测量之后触发：resize、字体加载、总装后的手动 refresh 都会走到这里
  ScrollTrigger.addEventListener('refresh', measure);
  measure();

  // Hero 入场：雹胚从屏幕上沿落到高度尺的 10 km 处停住。带滚动位置加载（刷新在页面中段）时不播。
  if (!reducedMotion && window.scrollY < 4) {
    gsap.fromTo(
      drop,
      { y: -(drop.getBoundingClientRect().bottom + 24) },
      { y: 0, duration: 1.1, delay: 0.7, ease: 'bounce.out' },
    );
  }
}
