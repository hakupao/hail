import { describe, expect, test } from 'vitest';
import { labPresets } from '../src/content';
import { simulate } from '../src/lab/model';
import { LAB_GRID, bitmapRow, cellOf, fractionOf, gridSize, h0At, outcomeGrid, paramsAt, wAt } from '../src/lab/outcome-map';

const grid = outcomeGrid();
const { cols, rows } = gridSize(LAB_GRID);

describe('结局地图矩阵', () => {
  test('网格与滑杆取值一一对应：46 列（5–50 m/s）× 41 行（2.0–6.0 km）', () => {
    expect(cols).toBe(46);
    expect(rows).toBe(41);
    expect(grid).toHaveLength(rows);
    expect(grid.every((r) => r.length === cols)).toBe(true);
    expect(wAt(0, LAB_GRID)).toBe(5);
    expect(wAt(cols - 1, LAB_GRID)).toBe(50);
    expect(h0At(0, LAB_GRID)).toBe(2);
    expect(h0At(3, LAB_GRID)).toBe(2.3); // 不是 2.3000000000000003
    expect(h0At(rows - 1, LAB_GRID)).toBe(6);
  });

  test('三个预设落在预期结局的格子里', () => {
    const expected = ['rain', 'hail', 'giant-hail'];
    labPresets.forEach((p, i) => {
      const { col, row } = cellOf(p.w, p.h0);
      expect(wAt(col, LAB_GRID)).toBe(p.w);
      expect(h0At(row, LAB_GRID)).toBe(p.h0);
      expect(grid[row][col]).toBe(expected[i]);
    });
  });

  test('W 最小的一列全是暴雨', () => {
    for (let row = 0; row < rows; row++) expect(grid[row][0]).toBe('rain');
  });

  test('每一格都等于 simulate 在该格参数下的结局', () => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        expect(grid[row][col]).toBe(simulate(wAt(col, LAB_GRID), h0At(row, LAB_GRID)).outcome);
      }
    }
  });

  test('四种结局在地图上都出现', () => {
    expect(new Set(grid.flat())).toEqual(new Set(['rain', 'small-hail', 'hail', 'giant-hail']));
  });
});

describe('地图位置 ↔ 参数', () => {
  test('每格中心往返不变', () => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const w = wAt(col, LAB_GRID);
        const h0 = h0At(row, LAB_GRID);
        const { fx, fy } = fractionOf(w, h0);
        expect(paramsAt(fx, fy)).toEqual({ w, h0 });
      }
    }
  });

  test('四角与越界位置夹到边缘格', () => {
    expect(paramsAt(0, 1)).toEqual({ w: 5, h0: 2 });
    expect(paramsAt(1, 0)).toEqual({ w: 50, h0: 6 });
    expect(paramsAt(-0.3, 1.4)).toEqual({ w: 5, h0: 2 });
    expect(paramsAt(1.2, -0.5)).toEqual({ w: 50, h0: 6 });
  });

  test('格线两侧 ±ε 分属相邻两格', () => {
    const eps = 1e-9;
    const mid = 0.5 / rows; // 最上一行的中线
    for (let col = 1; col < cols; col++) {
      const line = col / cols; // 第 col−1 列与第 col 列之间的竖格线
      expect(paramsAt(line - eps, mid).w).toBe(wAt(col - 1, LAB_GRID));
      expect(paramsAt(line + eps, mid).w).toBe(wAt(col, LAB_GRID));
    }
    for (let k = 1; k < rows; k++) {
      const line = k / rows; // 自上往下第 k 条横格线：上面是第 rows−k 行，下面是第 rows−k−1 行
      expect(paramsAt(0.5 / cols, line - eps).h0).toBe(h0At(rows - k, LAB_GRID));
      expect(paramsAt(0.5 / cols, line + eps).h0).toBe(h0At(rows - k - 1, LAB_GRID));
    }
  });

  test('位图左上角像素对应 W 最小、H₀ 最高那一格', () => {
    // ch4-lab.ts 把 matrix[row][col] 画在位图的 (col, bitmapRow(row))
    expect(bitmapRow(rows - 1)).toBe(0);
    expect(bitmapRow(0)).toBe(rows - 1);
    expect(wAt(0, LAB_GRID)).toBe(5);
    expect(h0At(rows - 1, LAB_GRID)).toBe(6);
    expect(paramsAt(0.5 / cols, 0.5 / rows)).toEqual({ w: 5, h0: 6 }); // 点位图左上角像素的中心
  });

  test('位图每个像素的颜色格与点它得到的参数是同一格', () => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const y = bitmapRow(row);
        expect(paramsAt((col + 0.5) / cols, (y + 0.5) / rows)).toEqual({ w: wAt(col, LAB_GRID), h0: h0At(row, LAB_GRID) });
      }
    }
  });

  test('H₀ 越高越靠上，W 越大越靠右', () => {
    expect(fractionOf(25, 6).fy).toBeLessThan(fractionOf(25, 2).fy);
    expect(fractionOf(50, 4).fx).toBeGreaterThan(fractionOf(5, 4).fx);
  });
});
