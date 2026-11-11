import { describe, expect, test } from 'vitest';
import html from '../index.html?raw';
import { K, MELT_RATE, simulate } from '../src/lab/model';
import {
  BOUNCE_SECONDS,
  LOOP_SECONDS,
  MIN_HAIL_UNITS,
  REST_TIME,
  STAGE,
  TIMING,
  fallSeconds,
  hailSize,
  kmToY,
  landingBounce,
  meltedCm,
  stageFrame,
  updraftArrows,
} from '../src/lab/stage';

const PEAK = TIMING.grow + TIMING.hang / 2;

describe('舞台坐标', () => {
  test('0℃ 线的位置与 H₀ 成正比，且始终在生长位置下方、地面上方', () => {
    expect(kmToY(0)).toBe(STAGE.groundY);
    expect(kmToY(4) - kmToY(2)).toBeCloseTo(kmToY(6) - kmToY(4), 9);
    expect(kmToY(6)).toBeGreaterThan(kmToY(STAGE.growKm));
    expect(kmToY(2)).toBeLessThan(STAGE.groundY);
  });
});

describe('冰雹尺寸映射', () => {
  test('下限以上严格按厘米数成比例，0.5 cm 看得见', () => {
    expect(hailSize(0.5)).toBe(MIN_HAIL_UNITS);
    expect(hailSize(8) / hailSize(4)).toBeCloseTo(2, 9);
  });

  test('模型里最大的冰雹（W = 50）在整个循环里都不出舞台', () => {
    const sim = simulate(50, 2);
    for (let t = 0; t < LOOP_SECONDS; t += 0.02) {
      const f = stageFrame(t, sim, 2);
      expect(f.y - f.size / 2).toBeGreaterThanOrEqual(0);
      expect(f.y + f.size / 2).toBeLessThanOrEqual(STAGE.groundY + 1e-9);
    }
  });
});

describe('示范冰雹的一个循环', () => {
  test('(30, 3.5)：云中最大与落地的渲染直径之比 = maxDiameterCm / finalDiameterCm，且落地更小', () => {
    const sim = simulate(30, 3.5);
    const peak = stageFrame(PEAK, sim, 3.5);
    const rest = stageFrame(REST_TIME, sim, 3.5);
    expect(peak.size / rest.size).toBeCloseTo(sim.maxDiameterCm / sim.finalDiameterCm, 9);
    expect(rest.size).toBeLessThan(peak.size);
    expect(rest.form).toBe('hail');
    expect(rest.y + rest.size / 2).toBeCloseTo(STAGE.groundY, 9);
  });

  test('0℃ 线以上保持最大，过线后单调缩小', () => {
    const sim = simulate(25, 4);
    const lineY = kmToY(4);
    let prev = Infinity;
    for (let t = TIMING.grow + TIMING.hang; t < LOOP_SECONDS; t += 0.01) {
      const f = stageFrame(t, sim, 4);
      if (f.y <= lineY) expect(f.dCm).toBeCloseTo(sim.maxDiameterCm, 9);
      expect(f.dCm).toBeLessThanOrEqual(prev + 1e-12);
      prev = f.dCm;
    }
    expect(prev).toBeCloseTo(sim.finalDiameterCm, 9);
  });

  test('rain 结局：0℃ 线以上是冰，落地是雨滴', () => {
    for (const [w, h0] of [[12, 5], [5, 6], [5, 2], [15, 6]] as const) {
      const sim = simulate(w, h0);
      expect(sim.outcome).toBe('rain');
      const lineY = kmToY(h0);
      for (let t = 0; t < LOOP_SECONDS; t += 0.01) {
        const f = stageFrame(t, sim, h0);
        if (f.y <= lineY) expect(f.form).toBe('hail');
      }
      expect(stageFrame(REST_TIME, sim, h0).form).toBe('drop');
    }
  });

  test('非 rain 结局全程是冰', () => {
    for (const [w, h0] of [[18, 4], [30, 3.5], [50, 3]] as const) {
      const sim = simulate(w, h0);
      for (let t = 0; t < LOOP_SECONDS; t += 0.01) expect(stageFrame(t, sim, h0).form).toBe('hail');
    }
  });
});

describe('上升气流箭头', () => {
  test('数量与速度随 W 单调不减，两端为 2 支与 6 支', () => {
    expect(updraftArrows(5).count).toBe(2);
    expect(updraftArrows(50).count).toBe(6);
    let prev = updraftArrows(5);
    for (let w = 6; w <= 50; w++) {
      const cur = updraftArrows(w);
      expect(cur.count).toBeGreaterThanOrEqual(prev.count);
      expect(cur.unitsPerSec).toBeGreaterThan(prev.unitsPerSec);
      prev = cur;
    }
  });
});

describe('落地回弹（v3，只是画面形变）', () => {
  test('任何时刻都不陷进地面；回弹窗口之外（含静态终态那一帧）是恒等', () => {
    for (const size of [MIN_HAIL_UNITS, 20, 45, 70]) {
      for (let t = 0; t < BOUNCE_SECONDS; t += 0.005) {
        const b = landingBounce(t, size);
        expect(b.lift).toBeGreaterThanOrEqual(0);
        expect(b.sx * b.sy).toBeGreaterThan(0.9); // 压扁时变宽，面积大致守恒
        expect(Math.abs(b.sy - 1)).toBeLessThan(0.25);
      }
      for (const t of [-1, BOUNCE_SECONDS, REST_TIME - (LOOP_SECONDS - TIMING.rest), TIMING.rest]) {
        expect(landingBounce(t, size)).toMatchObject({ lift: 0, sx: 1, sy: 1, dust: 1 });
      }
    }
  });

  test('越大越沉：压得更扁、跳得更低', () => {
    const peak = (size: number): { squash: number; lift: number } => {
      let squash = 0;
      let lift = 0;
      for (let t = 0; t < BOUNCE_SECONDS; t += 0.002) {
        const b = landingBounce(t, size);
        squash = Math.max(squash, 1 - b.sy);
        lift = Math.max(lift, b.lift);
      }
      return { squash, lift };
    };
    const small = peak(MIN_HAIL_UNITS);
    const big = peak(70);
    expect(big.squash).toBeGreaterThan(small.squash);
    expect(big.lift).toBeLessThan(small.lift);
  });
});

describe('「代入当前参数」的派生量（v3）', () => {
  test('下落用时与融化量和 simulate 的同一次结果自洽：d_max − r·t = d_落地（全化了为 0）', () => {
    for (let w = 5; w <= 50; w += 3) {
      for (let h0 = 2; h0 <= 6; h0 += 0.5) {
        const sim = simulate(w, h0);
        const t = fallSeconds(sim, h0);
        expect(t).toBeCloseTo((1000 * h0) / (K * Math.sqrt(sim.maxDiameterCm)), 9);
        expect(Math.max(0, sim.maxDiameterCm - MELT_RATE * t)).toBeCloseTo(sim.finalDiameterCm, 9);
        expect(meltedCm(sim)).toBeCloseTo(sim.maxDiameterCm - sim.finalDiameterCm, 12);
        expect(meltedCm(sim)).toBeCloseTo(Math.min(sim.maxDiameterCm, MELT_RATE * t), 9);
      }
    }
  });

  test('index.html 里写死的那一行（无 JS 时显示的）就是初始参数 (25, 4.0) 的模型结果', () => {
    const shown = (id: string): string => new RegExp(`id="${id}">([^<]*)<`).exec(html)![1];
    const sim = simulate(25, 4);
    expect(shown('lab-live-dmax')).toBe(`${sim.maxDiameterCm.toFixed(2)} cm`);
    expect(shown('lab-live-fall')).toBe(`${fallSeconds(sim, 4).toFixed(0)} s`);
    expect(shown('lab-live-melt')).toBe(`${meltedCm(sim).toFixed(2)} cm`);
    expect(shown('lab-live-dfinal')).toBe(`${sim.finalDiameterCm.toFixed(2)} cm`);
  });
});
