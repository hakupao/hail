export const K = 11; // 终端速度系数：v = K·√d（d: cm，v: m/s），按速度表校准
export const GROWTH_EFF = 0.65; // 生长效率：实际最大雹径占理论上限的比例
export const MELT_RATE = 0.002; // 暖层融化速率（cm/s）

export type Outcome = 'rain' | 'small-hail' | 'hail' | 'giant-hail';

export interface SimResult {
  outcome: Outcome;
  maxDiameterCm: number; // 云中最大雹径
  finalDiameterCm: number; // 融化后落地直径
  landingSpeedMs: number; // 落地速度（rain 时为 0）
}

export function terminalVelocity(dCm: number): number {
  return K * Math.sqrt(dCm);
}

// 前提：updraftMs > 0、freezingLevelKm > 0（由滑杆 min/max 保证）
export function simulate(updraftMs: number, freezingLevelKm: number): SimResult {
  // 上升气流托不住的临界点：K·√d = W → d = (W/K)²，再乘生长效率
  const dMax = GROWTH_EFF * (updraftMs / K) ** 2;
  // 简化：暖层厚度 = 0℃ 层高度（雹子一路融到地面），落地前在暖层的时间 ≈ 厚度/落速
  const fallSpeed = terminalVelocity(dMax);
  const warmSeconds = (freezingLevelKm * 1000) / fallSpeed;
  const dFinal = Math.max(0, dMax - MELT_RATE * warmSeconds);
  return {
    outcome: classify(dFinal),
    maxDiameterCm: dMax,
    finalDiameterCm: dFinal,
    landingSpeedMs: dFinal > 0 ? terminalVelocity(dFinal) : 0,
  };
}

function classify(dCm: number): Outcome {
  if (dCm < 0.5) return 'rain';
  if (dCm < 2) return 'small-hail';
  if (dCm <= 5) return 'hail'; // 5.0 cm 仍算危险冰雹，> 5 才是巨雹（边界故意取 <=）
  return 'giant-hail';
}
