import { K } from './model';
import type { SimResult } from './model';

// 剖面舞台的纯函数（不依赖 DOM）：坐标换算 + 「第 t 秒示范冰雹在哪、多大、是冰还是水」。
// 坐标单位是舞台 SVG 的 viewBox 单位（index.html 里 #lab-stage-svg 的 viewBox = 0 0 320 520）。

export const STAGE = {
  groundY: 470, // 0 km
  unitPerKm: 55, // 纵轴等比：8 km 在 y = 30
  hailX: 186, // 示范冰雹下落的竖线
  growKm: 7, // 冰雹在云里长大的位置：高于 0℃ 线能到的最高处（6 km）
} as const;

/** 高度（km）→ 舞台 y；线性，0℃ 线的位置因此与 H₀ 成正比 */
export function kmToY(km: number): number {
  return STAGE.groundY - km * STAGE.unitPerKm;
}

// 冰雹厘米数 → 屏幕直径：一条带下限的线性映射，云中最大与落地用的是同一条。
// 模型里云中最大雹径最大约 13.4 cm（W = 50）→ 70 单位，放得进舞台；下限让 0.5 cm 也看得见。
export const UNIT_PER_CM = 5.2;
export const MIN_HAIL_UNITS = 8;

export function hailSize(dCm: number): number {
  return Math.max(MIN_HAIL_UNITS, UNIT_PER_CM * dCm);
}

/** 模型里「化成雨」的直径门槛（model.ts 的 classify：< 0.5 cm 为 rain） */
const RAIN_BELOW_CM = 0.5;
const EMBRYO_UNITS = 3; // 雹胚：还没长成，不走厘米映射
const BOB_UNITS = 14; // 在云里被托着上下翻滚的幅度
const BOB_CYCLES = 2;
export const DROP_UNITS = 14; // 雨滴图形的高度

export const TIMING = { grow: 1.8, hang: 0.35, fall: 1.5, rest: 1.2 } as const;
export const LOOP_SECONDS = TIMING.grow + TIMING.hang + TIMING.fall + TIMING.rest;
/** 落地静止段内的一个时刻：reduced-motion 下直接呈现这一帧 */
export const REST_TIME = LOOP_SECONDS - TIMING.rest / 2;

export interface StageFrame {
  phase: 'grow' | 'hang' | 'fall' | 'rest';
  /** 冰雹（或雨滴）中心的 y */
  y: number;
  /** 冰雹的屏幕直径 */
  size: number;
  /** 此刻的直径（cm）；生长段是示意插值，hang 之后才是模型量 */
  dCm: number;
  form: 'hail' | 'drop';
}

const easeOut = (p: number): number => 1 - (1 - p) ** 2;
const easeIn = (p: number): number => p ** 1.7;

/** 循环动画第 t 秒的一帧。只用 simulate 的输出（云中最大、落地直径、结局）和 H₀。 */
export function stageFrame(t: number, sim: SimResult, h0: number): StageFrame {
  const growY = kmToY(STAGE.growKm);
  const maxSize = hailSize(sim.maxDiameterCm);
  const tt = ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;

  if (tt < TIMING.grow) {
    const p = tt / TIMING.grow;
    return {
      phase: 'grow',
      y: growY - BOB_UNITS * Math.sin(p * BOB_CYCLES * 2 * Math.PI),
      size: EMBRYO_UNITS + (maxSize - EMBRYO_UNITS) * easeOut(p),
      dCm: sim.maxDiameterCm * easeOut(p),
      form: 'hail',
    };
  }
  if (tt < TIMING.grow + TIMING.hang) {
    return { phase: 'hang', y: growY, size: maxSize, dCm: sim.maxDiameterCm, form: 'hail' };
  }

  const rain = sim.outcome === 'rain';
  const lineY = kmToY(h0);
  const endY = STAGE.groundY - (rain ? DROP_UNITS : hailSize(sim.finalDiameterCm)) / 2;
  const tf = tt - TIMING.grow - TIMING.hang;
  const resting = tf >= TIMING.fall;
  const y = resting ? endY : growY + (endY - growY) * easeIn(tf / TIMING.fall);

  // 过 0℃ 线后按下落的高度线性缩小（模型：匀速下落 × 恒定融化速率），落地时正好是落地直径
  const warm = Math.min(1, Math.max(0, (y - lineY) / (endY - lineY)));
  const dCm = sim.maxDiameterCm - (sim.maxDiameterCm - sim.finalDiameterCm) * warm;
  return {
    phase: resting ? 'rest' : 'fall',
    y,
    size: hailSize(dCm),
    dCm,
    form: rain && warm > 0 && dCm < RAIN_BELOW_CM ? 'drop' : 'hail',
  };
}

/** 上升气流箭头：数量与上升速度都只取决于 W（5–50 m/s） */
export function updraftArrows(w: number): { count: number; unitsPerSec: number } {
  const k = Math.min(1, Math.max(0, (w - 5) / 45));
  return { count: 2 + Math.round(k * 4), unitsPerSec: 30 + k * 170 };
}

// ---------- v3：落地回弹（只是画面上的挤压与小跳，不进 stageFrame——模型量与循环时序不变） ----------

/** 落地静止段开头这么多秒内有回弹；之后是恒等。必须小于 REST_TIME 距静止段开头的时间（静态终态不带形变） */
export const BOUNCE_SECONDS = 0.5;
const BIG_HAIL_UNITS = 70; // 模型里最大的冰雹（W = 50）在舞台上的直径

export interface Bounce {
  /** 离地高度（舞台单位，≥ 0：只会跳起，不会陷进地面） */
  lift: number;
  /** 以触地点为支点的横 / 纵缩放 */
  sx: number;
  sy: number;
  /** 0–1，尘团散开的进度；1 = 已散尽 */
  dust: number;
  /** 0（最小的雹）– 1（最大的雹）：越大越沉——压得更扁、跳得更低、扬的尘更多 */
  heavy: number;
}

/**
 * 落地后第 restT 秒的回弹：先压扁、再拉长并跳起一点、最后轻压一下停住。
 * @param restT 进入落地静止段后的秒数（不在静止段传负数）
 * @param size 冰雹的屏幕直径（舞台单位）
 */
export function landingBounce(restT: number, size: number): Bounce {
  const heavy = Math.min(1, Math.max(0, (size - MIN_HAIL_UNITS) / (BIG_HAIL_UNITS - MIN_HAIL_UNITS)));
  if (!(restT >= 0 && restT < BOUNCE_SECONDS)) return { lift: 0, sx: 1, sy: 1, dust: 1, heavy };
  const p = restT / BOUNCE_SECONDS;
  const wave = Math.sin(p * 3 * Math.PI) * (1 - p) ** 1.5; // 压 → 拉 → 轻压，逐次衰减
  const squash = (0.14 + 0.08 * heavy) * wave;
  return {
    lift: Math.max(0, -wave) * (7 - 5 * heavy),
    sx: 1 + squash,
    sy: 1 - squash,
    dust: 1 - (1 - p) ** 2,
    heavy,
  };
}

// ---------- v3：公式块下「代入当前参数」那一行的派生量（全部来自同一次 simulate 的结果） ----------

/** 第三条式子里的下落用时（秒）：1000·H₀ / (k·√d_max)——按云中最大雹径的落速算 */
export function fallSeconds(sim: SimResult, h0: number): number {
  return (1000 * h0) / (K * Math.sqrt(sim.maxDiameterCm));
}

/** 落地前化掉的直径（cm）：d_max − d_落地（全化了就等于 d_max） */
export function meltedCm(sim: SimResult): number {
  return sim.maxDiameterCm - sim.finalDiameterCm;
}
