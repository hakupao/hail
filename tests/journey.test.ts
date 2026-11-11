import { describe, expect, test } from 'vitest';
import {
  altitudeAt,
  normalizeAnchors,
  skyColorAt,
  skyGradient,
  stageAt,
  temperatureAt,
} from '../src/journey/anchors';

// 一张接近真实页面的锚点表（1440×900 量级）：pin 开始/结束、第二/三/四章顶、结尾顶
const measured = [
  { y: 900, km: 9.5 },
  { y: 3300, km: 5.5 },
  { y: 4200, km: 5 },
  { y: 6300, km: 1.5 },
  { y: 8400, km: 0.4 },
  { y: 9600, km: 0.1 },
];
const anchors = normalizeAnchors(measured, 9800);

describe('altitudeAt', () => {
  test('端点：页面顶 10 km，页面底 0 km，表外夹住', () => {
    expect(altitudeAt(0, anchors)).toBe(10);
    expect(altitudeAt(9800, anchors)).toBe(0);
    expect(altitudeAt(-50, anchors)).toBe(10);
    expect(altitudeAt(99999, anchors)).toBe(0);
  });

  test.each(measured)('锚点处取值正确：y=$y → $km km', ({ y, km }) => {
    expect(altitudeAt(y, anchors)).toBeCloseTo(km, 10);
  });

  test('锚点之间线性插值', () => {
    expect(altitudeAt(450, anchors)).toBeCloseTo(9.75, 10);
    expect(altitudeAt(2100, anchors)).toBeCloseTo(7.5, 10); // pin 走到一半
    expect(altitudeAt(5250, anchors)).toBeCloseTo(3.25, 10);
  });

  test('单调不增', () => {
    let prev = Infinity;
    for (let y = -100; y <= 10000; y += 7) {
      const alt = altitudeAt(y, anchors);
      expect(alt).toBeLessThanOrEqual(prev);
      prev = alt;
    }
  });

  test('空表不抛错', () => {
    expect(altitudeAt(100, [])).toBe(0);
  });
});

describe('normalizeAnchors', () => {
  test('补上页面顶与页面底', () => {
    expect(anchors[0]).toEqual({ y: 0, km: 10 });
    expect(anchors[anchors.length - 1]).toEqual({ y: 9800, km: 0 });
    expect(anchors).toHaveLength(measured.length + 2);
  });

  test('结尾恰好一屏（它的顶 = 页面底）时丢掉该锚点，页面底仍读 0', () => {
    const a = normalizeAnchors([...measured.slice(0, 5), { y: 9800, km: 0.1 }], 9800);
    expect(a).toHaveLength(7);
    expect(altitudeAt(9800, a)).toBe(0);
    expect(altitudeAt(9100, a)).toBeCloseTo(0.2, 10); // 第四章顶 0.4 → 页面底 0 的中点
  });

  test('乱序或重合的 y 被夹成单调不减，取值不出现 NaN', () => {
    const a = normalizeAnchors(
      [
        { y: 900, km: 9.5 },
        { y: 900, km: 5.5 }, // 无 pin 距离：与上一个重合
        { y: 800, km: 5 }, // 比上一个还靠前
      ],
      2000,
    );
    for (let i = 1; i < a.length; i++) expect(a[i].y).toBeGreaterThanOrEqual(a[i - 1].y);
    for (let y = 0; y <= 2000; y += 50) expect(Number.isNaN(altitudeAt(y, a))).toBe(false);
    expect(altitudeAt(2000, a)).toBe(0);
  });
});

describe('temperatureAt', () => {
  test('0℃ 层在 4.5 km', () => {
    expect(temperatureAt(4.5)).toBe(0);
  });

  test('地面约 29℃，10 km 约 −36℃', () => {
    expect(temperatureAt(0)).toBeCloseTo(29.25, 10);
    expect(temperatureAt(10)).toBeCloseTo(-35.75, 10);
    expect(Math.round(temperatureAt(0))).toBe(29);
    expect(Math.round(temperatureAt(10))).toBe(-36);
  });

  test('孕育区 5–10 km 全程在冰点以下', () => {
    expect(temperatureAt(5)).toBeLessThan(0);
  });
});

describe('stageAt', () => {
  test.each([
    [10, 'embryo'],
    [9.5, 'grow'],
    [5.5, 'grow'],
    [5, 'fall'],
    [1.6, 'fall'],
    [1.5, 'danger'],
    [0.4, 'lab'],
    [0.1, 'lab'],
    [0, 'landed'],
  ] as const)('%s km → %s', (km, stage) => {
    expect(stageAt(km)).toBe(stage);
  });
});

describe('天空', () => {
  test('色标处取值与规格一致', () => {
    expect(skyColorAt(10)).toBe('rgb(19, 37, 68)'); // #132544
    expect(skyColorAt(5)).toBe('rgb(35, 74, 125)'); // #234a7d
    expect(skyColorAt(1.6)).toBe('rgb(63, 110, 166)'); // #3f6ea6
    expect(skyColorAt(1.4)).toBe('rgb(207, 230, 247)'); // #cfe6f7
    expect(skyColorAt(0)).toBe('rgb(234, 245, 252)'); // #eaf5fc
  });

  test('渐变在云底分界的实测位置急转，分界以上不出现亮色', () => {
    const g = skyGradient(anchors, 6100);
    expect(g).toContain('rgb(63, 110, 166) 6100px, rgb(207, 230, 247) 6100px');
    const before = g.slice(0, g.indexOf('6100px'));
    expect(before).not.toContain('rgb(207, 230, 247)');
    expect(g.startsWith('linear-gradient(180deg, rgb(19, 37, 68) 0px')).toBe(true);
    expect(g.endsWith('rgb(234, 245, 252) 9800px)')).toBe(true);
  });
});
