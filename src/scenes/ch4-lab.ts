import { OUTCOME_ORDER, outcomeColor, outcomeIcon } from '../art/ch4';
import { labPresets, outcomeMeta } from '../content';
import { simulate } from '../lab/model';
import type { Outcome, SimResult } from '../lab/model';
import { LAB_GRID, bitmapRow, fractionOf, gridSize, outcomeGrid, paramsAt } from '../lab/outcome-map';
import { LOOP_SECONDS, REST_TIME, STAGE, TIMING, fallSeconds, kmToY, landingBounce, meltedCm, stageFrame, updraftArrows } from '../lab/stage';
import type { StageFrame } from '../lab/stage';
import { createMascot } from '../mascot/mascot';
import type { Expression, Reaction } from '../mascot/mascot';
import { observeInView, reducedMotion } from '../utils/motion';

// 第四章 · 冰雹实验室（v2 规格 §4）。两个参数 → simulate → 三处联动：
// 结果读数、剖面舞台（0℃ 线 / 上升气流箭头 / 示范冰雹循环）、结局地图上的圆点。
// 所有可视化只用 simulate 的输出和两个参数本身。

const ARROW_LANES = [226, 146, 254, 118, 282, 90]; // 箭头所在的竖线（x），按出现顺序由内向外
const ARROW_BOTTOM = 372; // 箭头在云体内循环上升的范围
const ARROW_SPAN = 262;
const IMPACT_Y = STAGE.groundY - 4; // 落地撞击线的起点：贴着地面线上沿
const MAP_W_TICKS = [5, 10, 20, 30, 40, 50];
const MAP_H_TICKS = [2, 3, 4, 5, 6];
// 预设名在地图上的摆法：靠右边缘的往左放，相邻的上下错开
const PRESET_LABEL_SIDE = ['right', 'right-up', 'left-down'];

// ---------- v3：示范冰雹的小脸 ----------
const STAGE_W = 320; // 舞台 viewBox（index.html 里 #lab-stage-svg）
const STAGE_H = 520;
const FACE_BOX = 1.3; // 脸的盒子边长 / 冰雹直径：雹宝视图盒 120，身体外缘直径约 93
const FACE_FROM = 12; // 冰雹直径（舞台单位）从这里起淡入小脸，到 FACE_FULL 完全显出；更小时只留两个点
const FACE_FULL = 15;
const DOTS_FROM = 5; // 比这还小（刚冒头的雹胚）什么都不画
const DROP_FOOT = 6.2; // 雨滴图形的底在它原点下方多少
const PHASE_FACE: Record<StageFrame['phase'], Expression> = { grow: 'happy', hang: 'happy', fall: 'scared', rest: 'dizzy' };
const REST_START = LOOP_SECONDS - TIMING.rest;
// 结局变了，实验室雹宝的反应（表情保持 lab：护目镜只跟着这个表情出现）
// 实验室雹宝随结局换表情（护目镜用 setGear 固定戴着）。只是表情，不是新的科学陈述
const OUTCOME_FACE: Record<Outcome, Expression> = { rain: 'sleepy', 'small-hail': 'happy', hail: 'wow', 'giant-hail': 'scared' };
const OUTCOME_REACTION: Record<Outcome, Reaction> = { rain: 'squash', 'small-hail': 'hop', hail: 'pop', 'giant-hail': 'shake' };
const POP_FRAMES: Keyframe[] = [
  { transform: 'scale(1)', easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
  { transform: 'scale(1.16)', offset: 0.32, easing: 'ease-in-out' },
  { transform: 'scale(0.97)', offset: 0.66, easing: 'ease-in-out' },
  { transform: 'scale(1)' },
];
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function initCh4(section: HTMLElement): void {
  const q = <T extends Element>(sel: string): T => section.querySelector<T>(sel)!;
  const wInput = q<HTMLInputElement>('#lab-w');
  const hInput = q<HTMLInputElement>('#lab-h0');
  const wOut = q<HTMLOutputElement>('#lab-w-out');
  const hOut = q<HTMLOutputElement>('#lab-h0-out');
  const chip = q<HTMLElement>('#lab-outcome-icon');
  const label = q<HTMLElement>('#lab-outcome-label');
  const dmaxEl = q<HTMLElement>('#lab-dmax');
  const dfinalEl = q<HTMLElement>('#lab-dfinal');
  const vlandEl = q<HTMLElement>('#lab-vland');

  const stageSvg = q<SVGSVGElement>('#lab-stage-svg');
  const zero = q<SVGGElement>('#lab-zero');
  const zeroLabel = q<SVGGElement>('#lab-zero-label');
  const zeroKm = q<SVGTSpanElement>('#lab-zero-km');
  const arrows = Array.from(section.querySelectorAll<SVGGElement>('.lab-arrow'));
  const hail = q<SVGGElement>('#lab-hail');
  const hailBody = q<SVGCircleElement>('#lab-hail-body');
  const hailShine = q<SVGPathElement>('#lab-hail-shine');
  const drop = q<SVGPathElement>('#lab-drop');
  const puddle = q<SVGEllipseElement>('#lab-puddle');
  const impact = q<SVGPathElement>('#lab-impact');
  const dots = q<SVGGElement>('#lab-hail-dots');
  const dust = q<SVGGElement>('#lab-dust');
  const dustPuffs = Array.from(dust.querySelectorAll('circle'));
  const dropFace = q<SVGGElement>('#lab-drop-face');
  const dropO = q<SVGCircleElement>('#lab-drop-o');
  const dropSmile = q<SVGPathElement>('#lab-drop-smile');
  const liveParams = q<HTMLElement>('#lab-live-params');
  const liveDmax = q<HTMLElement>('#lab-live-dmax');
  const liveFall = q<HTMLElement>('#lab-live-fall');
  const liveMelt = q<HTMLElement>('#lab-live-melt');
  const liveDfinal = q<HTMLElement>('#lab-live-dfinal');

  // 示范冰雹的小脸：盖在舞台 SVG 上面的一层 HTML，逐帧用百分比对到冰雹上（舞台与 viewBox 同比例）。
  // 冰雹本体（#lab-hail-body，被测量的那个圆）不因它改变。
  const face = createMascot(0, 'happy', { bare: true, idle: false });
  face.el.style.width = face.el.style.height = ''; // 尺寸交给 CSS
  const faceBox = document.createElement('div');
  faceBox.className = 'lab-face';
  faceBox.appendChild(face.el);
  q<HTMLElement>('.lab-stage').appendChild(faceBox);

  // 实验室助手雹宝（护目镜）
  const helper = createMascot(112, 'lab');
  helper.setGear('goggles');
  q<HTMLElement>('.lab-mascot-slot').appendChild(helper.el);

  // ---------- 结局地图：色块只在这里算一次，画进一张 46×41 的位图；之后拖动只移动圆点 ----------
  const mapEl = q<HTMLElement>('#lab-map');
  const pct = (f: number): string => `${(f * 100).toFixed(2)}%`;
  mapEl.innerHTML = `
    <div class="lab-map-head"><span class="lab-map-title">结局地图</span><span class="lab-map-hint">点一下或拖动，两个参数一起调</span></div>
    <div class="lab-map-body">
      <div class="lab-map-yaxis">${MAP_H_TICKS.map((h) => `<span style="top:${pct(fractionOf(LAB_GRID.wMin, h).fy)}">${h}</span>`).join('')}</div>
      <div class="lab-map-plot">
        <canvas class="lab-map-cells"></canvas>
        ${labPresets
          .map((p, i) => {
            const { fx, fy } = fractionOf(p.w, p.h0);
            return `<span class="lab-map-preset" data-side="${PRESET_LABEL_SIDE[i] ?? 'right'}" style="left:${pct(fx)};top:${pct(fy)}"><i></i><b>${p.name}</b></span>`;
          })
          .join('')}
        <div class="lab-map-dot-wrap"><i class="lab-map-dot"><b class="lab-map-pulse anim-loop"></b></i></div>
      </div>
      <div class="lab-map-xaxis">${MAP_W_TICKS.map((w) => `<span style="left:${pct(fractionOf(w, LAB_GRID.hMin).fx)}">${w}</span>`).join('')}</div>
    </div>
    <p class="lab-map-axes">横轴：上升气流（m/s）　纵轴：0℃ 层（km）</p>
    <ul class="lab-map-legend">${OUTCOME_ORDER.map((o) => `<li><i style="background:${outcomeColor[o]}"></i>${outcomeMeta[o].label}</li>`).join('')}</ul>`;

  const plot = q<HTMLElement>('.lab-map-plot');
  const dotWrap = q<HTMLElement>('.lab-map-dot-wrap');
  const cells = q<HTMLCanvasElement>('.lab-map-cells');
  const { cols, rows } = gridSize(LAB_GRID);
  cells.width = cols;
  cells.height = rows;
  const ctx = cells.getContext('2d')!;
  outcomeGrid(LAB_GRID).forEach((line, row) => {
    line.forEach((outcome, col) => {
      ctx.fillStyle = outcomeColor[outcome];
      ctx.fillRect(col, bitmapRow(row), 1, 1);
    });
  });

  // ---------- 状态 ----------
  let w = NaN;
  let h0 = NaN;
  let sim: SimResult = simulate(Number(wInput.value), Number(hInput.value));
  let arrowSpec = updraftArrows(Number(wInput.value));
  let loopStart = 0; // 当前这一轮示范冰雹循环的起点（rAF 时间戳）
  let lastTick = 0;
  let arrowTravel = 0; // 箭头累计上升的距离：不随参数变化归零，免得一调滑杆箭头就跳
  let raf = 0;
  let shownOutcome: Outcome | null = null; // 上一次显示的结局；null = 还没显示过（初始化那次不算「变了」）

  // ---------- 舞台绘制 ----------
  /** @param restT 进入落地静止段后的秒数（不在静止段为负）：只用来算回弹和尘团 */
  function drawFrame(f: StageFrame, restT: number): void {
    const isDrop = f.form === 'drop';
    const resting = f.phase === 'rest';
    const bounce = landingBounce(restT, f.size);
    const still = bounce.sx === 1 && bounce.sy === 1;
    const y = f.y - bounce.lift;
    // 以触地点为支点的挤压（回弹窗口之外是恒等，不写进 transform）
    const squash = (foot: number): string =>
      still ? '' : ` translate(0 ${foot.toFixed(2)}) scale(${bounce.sx.toFixed(4)} ${bounce.sy.toFixed(4)}) translate(0 ${(-foot).toFixed(2)})`;
    hail.setAttribute('display', isDrop ? 'none' : 'inline');
    drop.setAttribute('display', isDrop ? 'inline' : 'none');
    dropFace.setAttribute('display', isDrop ? 'inline' : 'none');
    puddle.setAttribute('display', isDrop && resting ? 'inline' : 'none');
    impact.setAttribute('display', !isDrop && resting ? 'inline' : 'none');
    let faceAlpha = 0;
    if (isDrop) {
      const at = `translate(${STAGE.hailX} ${f.y.toFixed(2)})${squash(DROP_FOOT)}`;
      drop.setAttribute('transform', at);
      dropFace.setAttribute('transform', at);
      dropO.setAttribute('display', resting ? 'none' : 'inline');
      dropSmile.setAttribute('display', resting ? 'inline' : 'none');
    } else {
      // 描边画在直径以内：圆的外缘直径正好是 f.size（云中最大与落地共用同一条厘米→屏幕映射）
      const stroke = Math.min(3, Math.max(2, f.size * 0.22));
      hail.setAttribute('transform', `translate(${STAGE.hailX} ${y.toFixed(2)})${squash(f.size / 2)}`);
      hailBody.setAttribute('r', ((f.size - stroke) / 2).toFixed(3));
      hailBody.setAttribute('stroke-width', stroke.toFixed(3));
      hailShine.setAttribute('transform', `scale(${(f.size / 20).toFixed(4)})`);
      if (resting) {
        const half = f.size / 2 + 4;
        impact.setAttribute(
          'd',
          `M${(STAGE.hailX - half).toFixed(1)} ${IMPACT_Y}l-6 -6M${(STAGE.hailX + half).toFixed(1)} ${IMPACT_Y}l6 -6`,
        );
      }
      // 小脸：够大才贴雹宝的脸，太小只留两个点
      faceAlpha = clamp01((f.size - FACE_FROM) / (FACE_FULL - FACE_FROM));
      const dotAlpha = (1 - faceAlpha) * clamp01((f.size - DOTS_FROM) / 2);
      dots.setAttribute('display', dotAlpha > 0 ? 'inline' : 'none');
      if (dotAlpha > 0) {
        dots.setAttribute('transform', `scale(${(f.size / 20).toFixed(4)})`);
        dots.setAttribute('opacity', dotAlpha.toFixed(2));
      }
    }
    faceBox.style.opacity = faceAlpha.toFixed(2);
    if (faceAlpha > 0) {
      const box = f.size * FACE_BOX;
      faceBox.style.width = `${((box / STAGE_W) * 100).toFixed(3)}%`;
      faceBox.style.left = `${(((STAGE.hailX - box / 2) / STAGE_W) * 100).toFixed(3)}%`;
      faceBox.style.top = `${(((y - box / 2) / STAGE_H) * 100).toFixed(3)}%`;
      faceBox.style.transform = still ? '' : `scale(${bounce.sx.toFixed(4)}, ${bounce.sy.toFixed(4)})`;
      face.setExpression(PHASE_FACE[f.phase]);
    }
    // 尘团：从冰雹两侧贴地散开、变大、变淡；越大的雹扬得越多
    const dusty = !isDrop && resting && bounce.dust < 1;
    dust.setAttribute('display', dusty ? 'inline' : 'none');
    if (dusty) {
      const reach = 6 + 10 * bounce.heavy;
      dust.setAttribute('opacity', (0.95 * (1 - bounce.dust ** 2)).toFixed(2));
      dustPuffs.forEach((c, i) => {
        const side = i % 2 ? 1 : -1;
        const far = i < 2 ? 1 : 0.5; // 每侧两团：一团跑得远，一团留在近处、略高
        c.setAttribute('cx', (STAGE.hailX + side * (f.size / 2 + 2 + reach * far * bounce.dust)).toFixed(1));
        c.setAttribute('cy', (STAGE.groundY - 3 - (i < 2 ? 2 : 8) * bounce.dust).toFixed(1));
        c.setAttribute('r', ((2.2 + 3.2 * bounce.dust) * (0.75 + 0.7 * bounce.heavy) * (i < 2 ? 1 : 0.7)).toFixed(2));
      });
    }
    if (stageSvg.dataset.phase !== f.phase) stageSvg.dataset.phase = f.phase;
  }

  function drawArrows(): void {
    arrows.forEach((el, i) => {
      if (i >= arrowSpec.count) {
        el.setAttribute('display', 'none');
        return;
      }
      el.setAttribute('display', 'inline');
      // reduced-motion：箭头留在 index.html 里写好的静止位置（这里是唯一会改它 transform 的地方）
      if (reducedMotion) return;
      // 每支箭头在云体内自下而上循环；首尾淡入淡出，避免凭空出现
      const p = ((arrowTravel + (i * ARROW_SPAN * 5) / 6) % ARROW_SPAN) / ARROW_SPAN;
      el.setAttribute('transform', `translate(${ARROW_LANES[i]} ${(ARROW_BOTTOM - p * ARROW_SPAN).toFixed(1)})`);
      el.setAttribute('opacity', Math.min(1, Math.sin(p * Math.PI) * 2.2).toFixed(2));
    });
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick);
    if (!loopStart) loopStart = now;
    arrowTravel += (Math.min(100, now - (lastTick || now)) / 1000) * arrowSpec.unitsPerSec;
    lastTick = now;
    drawArrows();
    const t = Math.max(0, (now - loopStart) / 1000);
    drawFrame(stageFrame(t, sim, h0), (t % LOOP_SECONDS) - REST_START);
  }

  function play(): void {
    if (raf || reducedMotion) return;
    loopStart = 0;
    lastTick = 0;
    raf = requestAnimationFrame(tick);
  }

  function pause(): void {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---------- 参数 → 全部联动 ----------
  function update(): void {
    const nw = Number(wInput.value);
    const nh = Number(hInput.value);
    if (nw === w && nh === h0) return;
    w = nw;
    h0 = nh;
    sim = simulate(w, h0);
    arrowSpec = updraftArrows(w);

    wOut.textContent = `${w} m/s`;
    hOut.textContent = `${h0.toFixed(1)} km`;

    const rain = sim.outcome === 'rain';
    // 结局没变（拖动时绝大多数帧）就不重建图标
    if (chip.dataset.outcome !== sim.outcome) {
      chip.innerHTML = outcomeIcon(sim.outcome);
      chip.dataset.outcome = sim.outcome;
      chip.style.background = outcomeColor[sim.outcome];
      label.textContent = outcomeMeta[sim.outcome].label;
    }
    // 结局真的变了才 pop（在同一个结局区域里拖动不会反复触发）；雹宝跟着做一个反应
    if (shownOutcome !== sim.outcome) {
      if (shownOutcome !== null && !reducedMotion) {
        label.animate(POP_FRAMES, { duration: 440, easing: 'linear' });
        helper.react(OUTCOME_REACTION[sim.outcome]);
      }
      helper.setExpression(OUTCOME_FACE[sim.outcome]);
      shownOutcome = sim.outcome;
    }
    dmaxEl.textContent = `${sim.maxDiameterCm.toFixed(1)} cm`;
    dfinalEl.textContent = rain ? '—（全化了）' : `${sim.finalDiameterCm.toFixed(1)} cm`;
    vlandEl.textContent = rain ? '—' : `${sim.landingSpeedMs.toFixed(0)} m/s`;

    // 公式块下「代入当前参数」：同一次 simulate 的结果（落地直径按模型输出，全化了就是 0）
    liveParams.innerHTML = `W = ${w} m/s，H<sub>0</sub> = ${h0.toFixed(1)} km`;
    liveDmax.textContent = `${sim.maxDiameterCm.toFixed(2)} cm`;
    liveFall.textContent = `${fallSeconds(sim, h0).toFixed(0)} s`;
    liveMelt.textContent = `${meltedCm(sim).toFixed(2)} cm`;
    liveDfinal.textContent = `${sim.finalDiameterCm.toFixed(2)} cm`;

    const lineY = kmToY(h0).toFixed(2);
    zero.setAttribute('transform', `translate(0 ${lineY})`);
    zeroLabel.setAttribute('transform', `translate(0 ${lineY})`);
    zeroKm.textContent = h0.toFixed(1);

    const { fx, fy } = fractionOf(w, h0);
    dotWrap.style.transform = `translate(${pct(fx)}, ${pct(fy)})`;

    if (reducedMotion) {
      // 静态终态：冰雹以落地大小停在地面（或雨滴），每次调参数都重画
      drawArrows();
      drawFrame(stageFrame(REST_TIME, sim, h0), REST_TIME - REST_START);
    } else {
      loopStart = 0; // 参数一变，示范冰雹立刻从头再来
      if (!raf) {
        drawArrows();
        drawFrame(stageFrame(0, sim, h0), -1);
      }
    }
  }

  function setParams(nw: number, nh: number): void {
    wInput.value = String(nw);
    hInput.value = String(nh);
    update();
  }

  wInput.addEventListener('input', update);
  hInput.addEventListener('input', update);

  // 预设按钮：单一数据源 content.ts → labPresets
  const presetBox = q<HTMLElement>('.lab-presets');
  for (const p of labPresets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.name;
    btn.addEventListener('click', () => setParams(p.w, p.h0));
    presetBox.appendChild(btn);
  }

  // 地图：点击或拖动同时设置两个参数。按下时捕获这个指针：滑出地图也不丢，别的指针（第二根手指）不掺和。
  let dragId: number | null = null;
  let dragRect: DOMRect; // 按下时量一次，拖动过程中不再逐帧量
  const pick = (e: PointerEvent): void => {
    const p = paramsAt((e.clientX - dragRect.left) / dragRect.width, (e.clientY - dragRect.top) / dragRect.height);
    setParams(p.w, p.h0);
  };
  const endDrag = (e: PointerEvent): void => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    plot.classList.remove('is-dragging');
  };
  plot.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || dragId !== null) return;
    e.preventDefault(); // 不选中文字、不拖出图片幽灵
    plot.setPointerCapture(e.pointerId);
    dragId = e.pointerId;
    dragRect = plot.getBoundingClientRect();
    plot.classList.add('is-dragging');
    pick(e);
  });
  plot.addEventListener('pointermove', (e) => {
    if (e.pointerId === dragId) pick(e);
  });
  plot.addEventListener('pointerup', endDrag);
  plot.addEventListener('pointercancel', endDrag);
  plot.addEventListener('lostpointercapture', endDrag); // 捕获被系统收走时也收尾，免得卡在拖动状态

  update(); // 初始状态（25 m/s, 4.0 km）→ 危险冰雹

  // 云团呼吸、地图圆点的脉冲：本章在场才动
  observeInView(section);

  // 舞台离开视口就停
  if (!reducedMotion) {
    new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) play();
      else pause();
    }).observe(stageSvg);
  }
}
