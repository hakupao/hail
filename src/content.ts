import type { IconName } from './art/icons';
import type { Outcome } from './lab/model';
import { tr } from './i18n/locale';

// 文案按当前语言取（<html lang> 在任何模块加载前已由 index.html 的 head 脚本写好）

// 高度尺参照物（v2 规格 §2.4）：icon 是 src/art/icons.ts 里的图标名
export const rulerMarks: Array<{ km: number; label: string; icon: IconName }> = [
  { km: 10, label: tr({ zh: '民航巡航', ja: '旅客機の巡航', en: 'Airliner cruise' }), icon: 'plane' },
  { km: 8.8, label: tr({ zh: '珠峰', ja: 'エベレスト', en: 'Everest' }), icon: 'everest' },
  { km: 4.5, label: tr({ zh: '0℃ 层', ja: '0℃ 層', en: '0℃ level' }), icon: 'freezing' },
  { km: 1.5, label: tr({ zh: '云底', ja: '雲底', en: 'Cloud base' }), icon: 'cloudBase' },
  { km: 0, label: tr({ zh: '地面', ja: '地面', en: 'Ground' }), icon: 'ground' },
];

// 第二章坠落竞速的四条赛道：规格速度表给的是范围（如 2–3 cm → 15–20 m/s），
// 动画需要单点，故取各范围的典型采样值（d: cm，v: m/s）；页面上的表格仍展示原始范围
// 注意：这些 v 是速度表的真实世界典型值（科普事实基准）。
// 实验室（ch4）的 v = K·√d 是简化教学模型（带免责声明），大尺寸端会偏低——两处数字允许不同，勿用模型值"修正"本表。
// kmh：展示值与页面速度表一致（35 是 ~10 m/s 的惯用取整，物理计时用 v）
export const raceLanes = [
  { name: tr({ zh: '黄豆', ja: '大豆', en: 'Pea' }), d: 1, v: 10, kmh: 35 },
  { name: tr({ zh: '乒乓球', ja: 'ピンポン玉', en: 'Ping-pong ball' }), d: 2.5, v: 17.5, kmh: 63 },
  { name: tr({ zh: '高尔夫', ja: 'ゴルフボール', en: 'Golf ball' }), d: 4.5, v: 27.5, kmh: 99 },
  { name: tr({ zh: '垒球', ja: 'ソフトボール', en: 'Softball' }), d: 7.5, v: 40, kmh: 144 },
];

// 第四章实验室预设（规格 §6）
export const labPresets = [
  { name: tr({ zh: '典型雷阵雨', ja: 'ふつうの雷雨', en: 'Typical thunderstorm' }), w: 12, h0: 5 },
  { name: tr({ zh: '强对流冰雹日', ja: '激しいひょうの日', en: 'Severe hail day' }), w: 30, h0: 3.5 },
  { name: tr({ zh: '1986 孟加拉', ja: '1986 バングラデシュ', en: '1986 Bangladesh' }), w: 50, h0: 3 },
];

// 实验室四种结局的名称（图标与颜色在 src/art/ch4.ts）
export const outcomeMeta: Record<Outcome, { label: string }> = {
  rain: { label: tr({ zh: '只下暴雨', ja: '強い雨だけ', en: 'Heavy rain only' }) },
  'small-hail': { label: tr({ zh: '小雹落地', ja: '小さなひょう', en: 'Small hail lands' }) },
  hail: { label: tr({ zh: '危险冰雹', ja: '危険なひょう', en: 'Dangerous hail' }) },
  'giant-hail': { label: tr({ zh: '巨雹警报', ja: '巨大ひょう警報', en: 'Giant hail alert' }) },
};
