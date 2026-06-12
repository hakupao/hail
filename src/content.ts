import type { Outcome } from './lab/model';

// 高度尺参照物（规格 §3）
export const rulerMarks = [
  { km: 10, label: '✈️ 民航巡航' },
  { km: 8.8, label: '⛰️ 珠峰' },
  { km: 4.5, label: '❄️ 0℃ 层' },
  { km: 1.5, label: '☁️ 云底' },
  { km: 0, label: '🏡 地面' },
];

// 第二章坠落竞速的四条赛道：规格速度表给的是范围（如 2–3 cm → 15–20 m/s），
// 动画需要单点，故取各范围的典型采样值（d: cm，v: m/s）；页面上的表格仍展示原始范围
export const raceLanes = [
  { name: '黄豆', d: 1, v: 10 },
  { name: '乒乓球', d: 2.5, v: 17.5 },
  { name: '高尔夫', d: 4.5, v: 27.5 },
  { name: '垒球', d: 7.5, v: 40 },
];

// 第四章实验室预设（规格 §6）
export const labPresets = [
  { name: '典型雷阵雨', w: 12, h0: 5 },
  { name: '强对流冰雹日', w: 30, h0: 3.5 },
  { name: '1986 孟加拉', w: 50, h0: 3 },
];

// 实验室四种结局的展示元数据
export const outcomeMeta: Record<Outcome, { emoji: string; label: string; tone: string }> = {
  rain: { emoji: '☔', label: '只下暴雨', tone: '#4a90d9' },
  'small-hail': { emoji: '🌨', label: '小雹落地', tone: '#7fb6e8' },
  hail: { emoji: '🧊', label: '危险冰雹', tone: '#e8a23a' },
  'giant-hail': { emoji: '💀', label: '巨雹警报', tone: '#e8503a' },
};
