// 旅程层的纯函数（规格 §2.1 / §2.2）。不依赖 DOM、gsap 或 utils/motion，可在 node 环境单测。

/** 一个锚点：滚动位置 y（px，视口顶对齐处）对应的高度 km */
export interface Anchor {
  y: number;
  km: number;
}

export type Stage = 'embryo' | 'grow' | 'fall' | 'danger' | 'lab' | 'landed';

const TOP_KM = 10;
const ZERO_LAYER_KM = 4.5; // 0℃ 层
const LAPSE_RATE = 6.5; // 直减率 ℃/km

/** 云底分界两侧的天空色标（按高度 km）。分界处急转：上缘 1.6 km，下缘 1.4 km。 */
const SKY_DARK = [
  { km: 10, c: '#132544' },
  { km: 5, c: '#234a7d' },
  { km: 1.6, c: '#3f6ea6' },
];
const SKY_LIGHT = [
  { km: 1.4, c: '#cfe6f7' },
  { km: 0, c: '#eaf5fc' },
];
const CLOUD_BASE_KM = 1.5;

/**
 * 把量到的中间锚点整理成一张可用的表：补上页面顶（0 → 10 km）与页面底（maxScroll → 0 km），
 * 丢掉落在页面底及以外的中间锚点（结尾恰好一屏时它的顶就是页面底），并保证 y 单调不减。
 */
export function normalizeAnchors(measured: Anchor[], maxScroll: number): Anchor[] {
  const out: Anchor[] = [{ y: 0, km: TOP_KM }];
  for (const a of measured) {
    if (a.y >= maxScroll) continue;
    out.push({ y: Math.max(a.y, out[out.length - 1].y), km: a.km });
  }
  out.push({ y: Math.max(maxScroll, out[out.length - 1].y), km: 0 });
  return out;
}

/** 滚动位置 → 高度（km）。锚点间分段线性；表外夹到两端。anchors 需按 y 单调不减。 */
export function altitudeAt(scrollY: number, anchors: Anchor[]): number {
  if (anchors.length === 0) return 0;
  if (scrollY <= anchors[0].y) return anchors[0].km;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    // scrollY < b.y 且 scrollY >= a.y，所以 b.y > a.y，不会除零（重合的锚点被自然跳过）
    if (scrollY < b.y) return a.km + ((b.km - a.km) * (scrollY - a.y)) / (b.y - a.y);
  }
  return anchors[anchors.length - 1].km;
}

/** 该高度的气温（℃）：0℃ 层在 4.5 km，直减率 6.5 ℃/km */
export function temperatureAt(altKm: number): number {
  return (ZERO_LAYER_KM - altKm) * LAPSE_RATE;
}

/** 主角所处的旅程阶段，只由高度决定（刷新后停在页面中段、往回滚都能得到正确状态） */
export function stageAt(altKm: number): Stage {
  const eps = 0.005;
  if (altKm > 9.5 + eps) return 'embryo';
  if (altKm > 5 + eps) return 'grow';
  if (altKm > CLOUD_BASE_KM + eps) return 'fall';
  if (altKm > 0.4 + eps) return 'danger';
  if (altKm > 0.05) return 'lab';
  return 'landed';
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpStops(stops: Array<{ km: number; c: string }>, km: number): string {
  // stops 按 km 递减
  if (km >= stops[0].km) return toRgb(hexToRgb(stops[0].c));
  for (let i = 1; i < stops.length; i++) {
    if (km >= stops[i].km) {
      const hi = stops[i - 1];
      const lo = stops[i];
      const t = (hi.km - km) / (hi.km - lo.km);
      const a = hexToRgb(hi.c);
      const b = hexToRgb(lo.c);
      return toRgb([0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)) as [number, number, number]);
    }
  }
  return toRgb(hexToRgb(stops[stops.length - 1].c));
}

function toRgb([r, g, b]: [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** 该高度的天空色。云底（1.5 km）以上走暗色标，以下走亮色标。 */
export function skyColorAt(altKm: number): string {
  return altKm > CLOUD_BASE_KM ? lerpStops(SKY_DARK, altKm) : lerpStops(SKY_LIGHT, altKm);
}

/**
 * 与文档等高的天空渐变。每个锚点一个像素色标（颜色取该锚点高度的天空色）；
 * 由暗转亮的急转钉在云底分界 SVG 的实测文档位置 cloudBaseY，而不是按高度反推——
 * 这样分界上方一定是暗色、第三章正文背后一定是亮色。
 */
export function skyGradient(anchors: Anchor[], cloudBaseY: number): string {
  const dark = SKY_DARK[SKY_DARK.length - 1];
  const light = SKY_LIGHT[0];
  const stops: string[] = [];
  for (const a of anchors) {
    if (a.y < cloudBaseY) stops.push(`${skyColorAt(Math.max(a.km, dark.km))} ${Math.round(a.y)}px`);
  }
  const cb = Math.round(cloudBaseY);
  stops.push(`${skyColorAt(dark.km)} ${cb}px`, `${skyColorAt(light.km)} ${cb}px`);
  for (const a of anchors) {
    if (a.y > cloudBaseY) stops.push(`${skyColorAt(Math.min(a.km, light.km))} ${Math.round(a.y)}px`);
  }
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}
