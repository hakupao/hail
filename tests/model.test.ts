import { describe, expect, test } from 'vitest';
import { simulate, terminalVelocity } from '../src/lab/model';

// 第二章速度表（规格 §3.1）：终端速度须落在表格范围 ±15% 内
const tableRows = [
  { d: 1, vLo: 10, vHi: 10 },
  { d: 2.5, vLo: 15, vHi: 20 },
  { d: 4.5, vLo: 25, vHi: 30 },
  { d: 7.5, vLo: 35, vHi: 45 },
];

describe('终端速度与速度表自洽', () => {
  test.each(tableRows)('⌀$d cm 的速度落在表格范围 ±15% 内', ({ d, vLo, vHi }) => {
    const v = terminalVelocity(d);
    expect(v).toBeGreaterThanOrEqual(vLo * 0.85);
    expect(v).toBeLessThanOrEqual(vHi * 1.15);
  });
});

describe('结局判定', () => {
  test('极弱上升气流（5 m/s）在任何 0℃ 层高度下都只下暴雨', () => {
    for (const h0 of [2, 3, 4, 5, 6]) {
      expect(simulate(5, h0).outcome).toBe('rain');
    }
  });

  test('预设：典型雷阵雨 (12, 5) → rain', () => {
    expect(simulate(12, 5).outcome).toBe('rain');
  });

  test('预设：强对流冰雹日 (30, 3.5) → hail', () => {
    expect(simulate(30, 3.5).outcome).toBe('hail');
  });

  test('预设：1986 孟加拉 (50, 3) → giant-hail，落地速度超过 40 m/s', () => {
    const r = simulate(50, 3);
    expect(r.outcome).toBe('giant-hail');
    expect(r.landingSpeedMs).toBeGreaterThan(40);
  });

  test('上升气流越强，云中最大雹径单调增大', () => {
    let prev = 0;
    for (const w of [10, 20, 30, 40, 50]) {
      const d = simulate(w, 4).maxDiameterCm;
      expect(d).toBeGreaterThan(prev);
      prev = d;
    }
  });
});
