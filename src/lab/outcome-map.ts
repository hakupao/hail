import { simulate } from './model';
import type { Outcome } from './model';

// 结局地图的纯函数（不依赖 DOM）：W × H₀ 网格上每一格的结局，以及「地图上的位置 ↔ 参数」的双向换算。
// 网格与两个滑杆的取值一一对应（每格中心就是一个滑杆取值），所以圆点和滑杆天然对齐。

export interface MapGrid {
  wMin: number;
  wMax: number;
  wStep: number;
  hMin: number;
  hMax: number;
  hStep: number;
}

/** 与 index.html 里两个滑杆的 min / max / step 一致 */
export const LAB_GRID: MapGrid = { wMin: 5, wMax: 50, wStep: 1, hMin: 2, hMax: 6, hStep: 0.1 };

export function gridSize(g: MapGrid): { cols: number; rows: number } {
  return {
    cols: Math.round((g.wMax - g.wMin) / g.wStep) + 1,
    rows: Math.round((g.hMax - g.hMin) / g.hStep) + 1,
  };
}

// 先乘后舍入：避免 2 + 0.1 × 3 = 2.3000000000000003 这类浮点尾巴把格子推过结局边界
const snap = (v: number): number => Math.round(v * 1e6) / 1e6;

export function wAt(col: number, g: MapGrid): number {
  return snap(g.wMin + col * g.wStep);
}

export function h0At(row: number, g: MapGrid): number {
  return snap(g.hMin + row * g.hStep);
}

/** 结局矩阵：matrix[row][col]，row 0 是 H₀ 最低的一行，col 0 是 W 最小的一列 */
export function outcomeGrid(g: MapGrid = LAB_GRID): Outcome[][] {
  const { cols, rows } = gridSize(g);
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => simulate(wAt(col, g), h0At(row, g)).outcome),
  );
}

const clampIndex = (i: number, n: number): number => Math.min(n - 1, Math.max(0, i));

/** 参数 → 所在格的行列号（超出范围的参数夹到边缘格） */
export function cellOf(w: number, h0: number, g: MapGrid = LAB_GRID): { col: number; row: number } {
  const { cols, rows } = gridSize(g);
  return {
    col: clampIndex(Math.round((w - g.wMin) / g.wStep), cols),
    row: clampIndex(Math.round((h0 - g.hMin) / g.hStep), rows),
  };
}

/** 地图上的相对位置（fx 自左向右、fy 自上向下，均 0–1；越界夹到边缘）→ 该处所在格的参数 */
export function paramsAt(fx: number, fy: number, g: MapGrid = LAB_GRID): { w: number; h0: number } {
  const { cols, rows } = gridSize(g);
  const col = clampIndex(Math.floor(fx * cols), cols);
  const row = clampIndex(Math.floor((1 - fy) * rows), rows);
  return { w: wAt(col, g), h0: h0At(row, g) };
}

/** 参数 → 所在格中心在地图上的相对位置（fx 自左向右、fy 自上向下） */
export function fractionOf(w: number, h0: number, g: MapGrid = LAB_GRID): { fx: number; fy: number } {
  const { cols, rows } = gridSize(g);
  const { col, row } = cellOf(w, h0, g);
  return { fx: (col + 0.5) / cols, fy: 1 - (row + 0.5) / rows };
}
