import type { Outcome } from '../lab/model';

// 第四章专用：四种结局的内联 SVG 图标与颜色（结局名称在 content.ts → outcomeMeta）。
// 图标规则同 icons.ts：24×24、currentColor、圆头线端。

const OUTCOME_ICONS: Record<Outcome, string> = {
  // 只下暴雨：云 + 斜雨线
  rain: '<path d="M7 14h10a3.5 3.5 0 0 0 .6-6.95A5 5 0 0 0 8 6.2 4 4 0 0 0 7 14z"/><path d="M8.5 17.5l-1 3.2M12.5 17.5l-1 3.2M16.5 17.5l-1 3.2"/>',
  // 小雹落地：云 + 三粒小雹
  'small-hail':
    '<path d="M7 14h10a3.5 3.5 0 0 0 .6-6.95A5 5 0 0 0 8 6.2 4 4 0 0 0 7 14z"/><g fill="currentColor" stroke="none"><circle cx="8" cy="18.6" r="1.5"/><circle cx="12" cy="20.4" r="1.5"/><circle cx="16" cy="18.6" r="1.5"/></g>',
  // 危险冰雹：一颗带下落速度线的大雹
  hail: '<circle cx="12" cy="14.5" r="6"/><path d="M8.8 13.2a3.4 3.4 0 0 1 2.4-2.3"/><path d="M6.5 3v3M12 2v3.5M17.5 3v3"/>',
  // 巨雹警报：警示三角
  'giant-hail': '<path d="M12 3.6L21.4 20H2.6z"/><path d="M12 10v4.6"/><circle cx="12" cy="17.3" r="0.6" fill="currentColor"/>',
};

export function outcomeIcon(outcome: Outcome, sizePx = 28): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="${sizePx}" height="${sizePx}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OUTCOME_ICONS[outcome]}</svg>`;
}

/** 结局色：暴雨一个蓝，三种落雹结局沿危险色带（规格 §3.1）逐级升级：警示黄 → #f2994a → 危险红。
 *  只用作色块（地图格子、图例、结局图标的底），不用作文字颜色（对比度不够）。 */
export const outcomeColor: Record<Outcome, string> = {
  rain: '#4f93d8',
  'small-hail': '#ffd23f',
  hail: '#f2994a',
  'giant-hail': '#e5484d',
};

export const OUTCOME_ORDER: Outcome[] = ['rain', 'small-hail', 'hail', 'giant-hail'];
