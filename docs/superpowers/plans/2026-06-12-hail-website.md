# 冰雹科普网页 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端单页滚动科普网页《一颗冰雹的诞生与坠落》——扁平信息图风 + 雹宝吉祥物，用动画把冰雹的三个核心数字（生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm）具象化，外加交互式"冰雹实验室"。

**Architecture:** 双层混合：背景层（滚动驱动的天空渐变 + 右侧高度尺）贯穿全站、与章节零耦合；前景六个章节场景（hero / ch1–ch4 / ending）各自独立模块、各自管理自己的 ScrollTrigger。实验室物理是纯函数模块，用 vitest 做 TDD。

**Tech Stack:** Vite 7 + TypeScript（无框架）、GSAP 3 + ScrollTrigger、SVG（插画/角色）、Canvas 2D（粒子）、vitest（单测）。

**规格文档:** `docs/superpowers/specs/2026-06-12-hail-website-design.md`（已获批准，所有文案与数值以它为准）

---

## 文件地图

| 文件 | 职责 | 创建于 |
|---|---|---|
| `package.json` / `tsconfig.json` / `vite.config.ts` | 工具链 | Task 1 |
| `tests/model.test.ts` | 实验室模型单测 | Task 2 |
| `src/lab/model.ts` | 物理模型纯函数 `simulate()` | Task 2 |
| `src/content.ts` | 全部数据：表格、参照物、预设、结局元数据 | Task 3 |
| `index.html` | 六章静态骨架（无 JS 可读全部文案） | Task 4 |
| `src/styles/tokens.css` / `base.css` / `sections.css` | 设计令牌 / 重置 / 章节样式 | Task 4 |
| `src/background/sky.ts` / `ruler.ts` | 天空渐变 / 高度尺 | Task 5 |
| `src/utils/motion.ts` / `counter.ts` / `particles.ts` | 降级开关 / 数字滚动 / 粒子场 | Task 6 |
| `src/mascot/mascot.ts` | 雹宝 SVG 角色 | Task 7 |
| `src/scenes/hero.ts` | Hero 场景 | Task 8 |
| `src/scenes/ch1-height.ts` | 第一章 生成高度 | Task 9 |
| `src/scenes/ch2-speed.ts` | 第二章 坠落竞速 | Task 10 |
| `src/scenes/ch3-danger.ts` | 第三章 危险阈值 | Task 11 |
| `src/scenes/ch4-lab.ts` | 第四章 实验室 UI | Task 12 |
| `src/scenes/ending.ts` + `src/main.ts` | 结尾 + 总装入口 | Task 13 |
| `src/styles/sections.css`（追加） | 响应式 + reduced-motion | Task 14 |
| `README.md` | 项目说明 | Task 15 |

每个场景模块只暴露 `initXxx(section: HTMLElement): void`，内部自建 ScrollTrigger；改一章不碰其他章。

**通用约定：**
- 每个 Task 结束都 `git commit`（信息见各 Task 最后一步）
- 视觉验证：`npm run dev` 后在浏览器核对"预期画面"清单；有 Chrome DevTools MCP 可截图核对，没有就人工看
- 所有命令在仓库根目录 `/Users/bojiangzhang/MyProject/hail` 执行

---

### Task 1: 项目脚手架与工具链

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`（临时占位，Task 4 重写）
- Create: `src/main.ts`（临时占位，Task 13 重写）

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "hail",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "gsap": "^3.13.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: 创建 `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: { environment: 'node' },
});
```

- [ ] **Step 4: 创建临时 `index.html`（根目录）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>一颗冰雹的诞生与坠落</title>
</head>
<body>
  <main id="app"><h1>冰雹 · 施工中</h1></main>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: 创建临时 `src/main.ts`**

```ts
console.log('hail: scaffold ok');
```

- [ ] **Step 6: 安装依赖并验证**

```bash
npm install
npm run typecheck
npm run build
```

预期：install 无 error；typecheck 零报错；build 产出 `dist/`。

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "chore: Vite + TypeScript + vitest 脚手架"
```

---

### Task 2: 实验室物理模型（TDD）

**Files:**
- Test: `tests/model.test.ts`
- Create: `src/lab/model.ts`

模型（规格 §6）：`v = K·√d`（d: cm，v: m/s）；最大雹径 `d_max = GROWTH_EFF · (W/K)²`；融化损耗 = `MELT_RATE × (H₀×1000 / v)`。常量经过预先校算：**K=11, GROWTH_EFF=0.65, MELT_RATE=0.002**——三个预设结局和速度表校准在这组常量下全部通过（雷阵雨 final≈0 → rain；强对流 final≈4.5 cm → hail；孟加拉 final≈13.3 cm、落速≈40.1 m/s → giant-hail）。

- [ ] **Step 1: 写失败的测试 `tests/model.test.ts`**

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test
```

预期：FAIL，报错 `Cannot find module '../src/lab/model'`（或同义错误）。

- [ ] **Step 3: 实现 `src/lab/model.ts`**

```ts
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

export function simulate(updraftMs: number, freezingLevelKm: number): SimResult {
  // 上升气流托不住的临界点：K·√d = W → d = (W/K)²，再乘生长效率
  const dMax = GROWTH_EFF * (updraftMs / K) ** 2;
  // 落地前在暖层（0℃ 层以下）的时间 ≈ 暖层厚度 / 下落速度
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
  if (dCm <= 5) return 'hail';
  return 'giant-hail';
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test
```

预期：8 个测试全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add tests/model.test.ts src/lab/model.ts
git commit -m "feat: 实验室物理模型 simulate()（TDD）"
```

---

### Task 3: 内容数据模块

**Files:**
- Create: `src/content.ts`

约定：**人读的文案放 `index.html`**（无 JS 可读），**JS 消费的数据放 `content.ts`**——两边不重复存同一份内容。

- [ ] **Step 1: 创建 `src/content.ts`**

```ts
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
```

- [ ] **Step 2: 验证类型**

```bash
npm run typecheck
```

预期：零报错。

- [ ] **Step 3: Commit**

```bash
git add src/content.ts
git commit -m "feat: 内容数据模块 content.ts"
```

---

### Task 4: 静态骨架 index.html + 全部样式

**Files:**
- Modify: `index.html`（整体替换 Task 1 的占位）
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/sections.css`

- [ ] **Step 1: 重写 `index.html`（完整替换）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>一颗冰雹的诞生与坠落</title>
  <meta name="description" content="用动画看懂冰雹：生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm，外加一个可以自己调参数的冰雹实验室。" />
</head>
<body>
  <main id="app">

    <!-- ========== HERO ========== -->
    <section id="hero" class="scene on-dark">
      <div class="scene-inner hero-inner">
        <p class="kicker">HAIL · 一份会动的科普</p>
        <h1 class="hero-title">一颗冰雹的<br />诞生与坠落</h1>
        <div class="hero-mascot-slot"></div>
        <div class="num-cards">
          <div class="num-card">
            <div class="num">5–10 <small>km</small></div>
            <div class="num-label">生成高度</div>
            <p>诞生于积雨云中上部的"孕育区"</p>
          </div>
          <div class="num-card">
            <div class="num">10–40+ <small>m/s</small></div>
            <div class="num-label">落地速度</div>
            <p>个头越大砸得越快：v ∝ √d</p>
          </div>
          <div class="num-card">
            <div class="num">⌀2 <small>cm</small></div>
            <div class="num-label">危险起点</div>
            <p>硬币大小就开始具备伤人能力</p>
          </div>
        </div>
        <p class="scroll-hint">↓ 往下滚，跟着它落一次地</p>
      </div>
    </section>

    <!-- ========== 第一章 生成高度 ========== -->
    <section id="ch1" class="scene on-dark">
      <div class="scene-inner">
        <h2><span class="ch-no">第一章</span>生成高度：5–10 公里</h2>
        <p class="lead">冰雹诞生在发展旺盛的积雨云里。云底可能只有 1–2 公里高，但真正的"孕育区"在云的中上部——温度 −10℃ 到 −30℃ 的层面，夏季大约对应离地 5–10 公里。</p>
        <div class="ch1-stage">
          <svg viewBox="0 0 640 520" class="cloud-svg" role="img" aria-label="积雨云剖面示意图：雹胚在孕育区被上升气流反复托起，每翻滚一次裹一层冰">
            <g class="cloud-body">
              <ellipse cx="320" cy="300" rx="240" ry="150" fill="#3d5578" />
              <ellipse cx="180" cy="360" rx="120" ry="80" fill="#46618a" />
              <ellipse cx="470" cy="350" rx="130" ry="90" fill="#46618a" />
              <ellipse cx="320" cy="170" rx="150" ry="80" fill="#54719c" />
            </g>
            <g class="growth-zone">
              <rect x="120" y="140" width="400" height="130" fill="rgba(191,227,255,.14)" stroke="#bfe3ff" stroke-width="2" stroke-dasharray="8 6" rx="10" />
              <text x="135" y="165" fill="#bfe3ff" font-size="16">孕育区 −10℃ ～ −30℃ · 约 5–10 km</text>
            </g>
            <g class="updraft-arrows">
              <path d="M200 430 v-60 m0 0 l-10 14 m10 -14 l10 14" stroke="#8fd3ff" stroke-width="4" fill="none" stroke-linecap="round" />
              <path d="M440 440 v-70 m0 0 l-10 14 m10 -14 l10 14" stroke="#8fd3ff" stroke-width="4" fill="none" stroke-linecap="round" />
            </g>
            <circle class="embryo" cx="320" cy="260" r="14" fill="#eef8ff" stroke="#9fcbe8" stroke-width="3" />
            <g class="onion" transform="translate(560 120)">
              <circle r="12" fill="#eef8ff" stroke="#9fcbe8" stroke-width="2" />
              <circle class="onion-ring" r="20" fill="none" stroke="#cfe9fa" stroke-width="3" />
              <circle class="onion-ring" r="28" fill="none" stroke="#bfe3ff" stroke-width="3" />
              <circle class="onion-ring" r="36" fill="none" stroke="#cfe9fa" stroke-width="3" />
              <circle class="onion-ring" r="44" fill="none" stroke="#bfe3ff" stroke-width="3" />
              <text y="68" text-anchor="middle" fill="#bfe3ff" font-size="13">切开像洋葱：一圈 = 翻滚一次</text>
            </g>
          </svg>
        </div>
        <p class="melt-note">雹胚被上升气流反复托起、下落，每翻滚一次就裹上一层冰。上升气流越强，能托住的冰雹就越大。<br />太小的雹子下落途中经过 0℃ 层（约 4–5 km）就化成了雨——能落到地面的，通常已有一定个头。<span class="melt-demo">🧊→💧</span></p>
      </div>
    </section>

    <!-- ========== 第二章 坠落速度 ========== -->
    <section id="ch2" class="scene on-dark">
      <div class="scene-inner">
        <h2><span class="ch-no">第二章</span>落地速度：v ∝ √d</h2>
        <p class="lead">下落时重力与空气阻力很快平衡，进入"终端速度"。质量随直径三次方增长，迎风面积只随平方增长——所以 <span class="formula">v ∝ √d：个头越大，落得越快</span>。</p>
        <div class="race">
          <div class="race-track">
            <div class="lane">
              <div class="race-dial">35 km/h</div>
              <div class="race-ball" style="--d: 10px"></div>
              <div class="lane-label">黄豆 1 cm</div>
            </div>
            <div class="lane">
              <div class="race-dial">63 km/h</div>
              <div class="race-ball" style="--d: 25px"></div>
              <div class="lane-label">乒乓球 2.5 cm</div>
            </div>
            <div class="lane">
              <div class="race-dial">99 km/h</div>
              <div class="race-ball" style="--d: 45px"></div>
              <div class="lane-label">高尔夫 4.5 cm</div>
            </div>
            <div class="lane">
              <div class="race-dial">144 km/h</div>
              <div class="race-ball" style="--d: 75px"></div>
              <div class="lane-label">垒球 7.5 cm</div>
            </div>
          </div>
          <button class="race-replay" type="button">↻ 再比一次</button>
        </div>
        <table class="speed-table">
          <thead>
            <tr><th>直径</th><th>参照物</th><th>落地速度</th><th>危险程度</th></tr>
          </thead>
          <tbody>
            <tr class="speed-row"><td>1 cm</td><td>黄豆～指甲</td><td>~10 m/s（35 km/h）</td><td>砸着疼，基本无害</td></tr>
            <tr class="speed-row"><td>2–3 cm</td><td>硬币～乒乓球</td><td>15–20 m/s（50–70 km/h）</td><td>可致淤青、砸伤眼睛</td></tr>
            <tr class="speed-row"><td>4–5 cm</td><td>高尔夫球</td><td>25–30 m/s（约 100 km/h）</td><td>头部裂伤、脑震荡风险</td></tr>
            <tr class="speed-row"><td>7–8 cm</td><td>棒球～垒球</td><td>35–45 m/s（130–160 km/h）</td><td>可能致命</td></tr>
          </tbody>
        </table>
        <p class="note">数值受形状、密度、风的影响，为典型范围。</p>
      </div>
    </section>

    <!-- ========== 第三章 危险阈值 ========== -->
    <section id="ch3" class="scene on-light">
      <div class="scene-inner">
        <h2><span class="ch-no">第三章</span>危险阈值：⌀2 cm 起步</h2>
        <p class="lead">很多国家把 2–2.5 厘米定为强对流灾害预警的门槛——这不是随便定的。用动能感受一下。</p>
        <div class="size-ladder">
          <div class="size-item" style="--d: 10px"><span class="size-dot"></span><span class="size-name">黄豆 1 cm</span></div>
          <div class="size-item" style="--d: 25px"><span class="size-dot"></span><span class="size-name">乒乓球 2.5 cm</span></div>
          <div class="size-item" style="--d: 45px"><span class="size-dot"></span><span class="size-name">高尔夫 4.5 cm</span></div>
          <div class="size-item" style="--d: 75px"><span class="size-dot"></span><span class="size-name">垒球 7.5 cm</span></div>
        </div>
        <div class="danger-band"><div class="danger-pointer"></div></div>
        <div class="energy-bars">
          <div class="energy-bar energy-20">
            <div class="energy-head">⌀5 cm · 约 50 多克</div>
            <div class="energy-track"><div class="energy-fill"></div></div>
            <div class="energy-num">20 J</div>
            <p>≈ 一个棒球以 60 km/h 砸中你 ⚾</p>
          </div>
          <div class="energy-bar energy-170">
            <div class="energy-head">⌀8 cm</div>
            <div class="energy-track"><div class="energy-fill"></div></div>
            <div class="energy-num">170 J</div>
            <p>超过职业投手快速球的能量——直接命中头部足以致命</p>
          </div>
        </div>
        <aside class="history-card">
          <div class="history-mascot-slot"></div>
          <h3>1986 · 孟加拉国</h3>
          <p>有记录以来最惨重的雹灾之一：单颗冰雹重近 1 公斤，近百人遇难。</p>
        </aside>
        <div class="safety-cards">
          <div class="safety-card">
            <h3>🪙 硬币大小</h3>
            <p>就别在外面晃了，找地方避一避。</p>
          </div>
          <div class="safety-card">
            <h3>⛳ 高尔夫球大小</h3>
            <p>立刻进入坚固掩体，并离窗户远一点——大冰雹砸碎玻璃的二次伤害很常见。</p>
            <div class="safety-mascot-slot"></div>
          </div>
        </div>
        <p class="season-tip">☂️ 应季提醒：六月正是关东地区冰雹高发季——强对流多发于初夏午后。</p>
      </div>
    </section>

    <!-- ========== 第四章 冰雹实验室 ========== -->
    <section id="ch4" class="scene on-light">
      <div class="scene-inner">
        <h2><span class="ch-no">第四章</span>冰雹实验室 🧪</h2>
        <p class="lead">为什么有的雷暴下冰雹、有的只下暴雨？气象台盯着两个参数：<b>上升气流强度</b>（决定托得住多大的雹）和 <b>0℃ 层高度</b>（决定落地前化掉多少）。自己调调看。</p>
        <div class="lab">
          <div class="lab-controls">
            <label>上升气流强度 <output id="lab-w-out">25 m/s</output>
              <input type="range" id="lab-w" min="5" max="50" value="25" step="1" />
            </label>
            <label>0℃ 层高度 <output id="lab-h0-out">4.0 km</output>
              <input type="range" id="lab-h0" min="2" max="6" value="4" step="0.1" />
            </label>
            <div class="lab-presets"><!-- 预设按钮由 JS 从 content.ts 的 labPresets 生成（无 JS 时按钮无意义） --></div>
            <div class="lab-mascot-slot"></div>
          </div>
          <div class="lab-stage">
            <div class="lab-cloud"><div class="lab-cloud-shade"></div></div>
            <canvas id="lab-canvas"></canvas>
            <div class="lab-outcome">
              <div class="lab-outcome-emoji" id="lab-outcome-emoji">🧊</div>
              <div class="lab-outcome-label" id="lab-outcome-label">危险冰雹</div>
              <dl>
                <div><dt>云中最大雹径</dt><dd id="lab-dmax">—</dd></div>
                <div><dt>落地直径</dt><dd id="lab-dfinal">—</dd></div>
                <div><dt>落地速度</dt><dd id="lab-vland">—</dd></div>
              </dl>
            </div>
          </div>
        </div>
        <p class="note">简化教学模型：v = k·√d 加线性融化损耗，用于直觉演示，并非数值天气预报。</p>
      </div>
    </section>

    <!-- ========== 结尾 ========== -->
    <section id="ending" class="scene on-light">
      <div class="scene-inner center">
        <h2>落地。</h2>
        <div class="ending-stage">
          <div class="ending-mascot-slot"></div>
          <div class="puddle"></div>
          <div class="grass"></div>
        </div>
        <p class="lead">一颗冰雹的一生：在 5–10 公里的高空翻滚长大，以与 √直径 成正比的速度坠落，超过 2 厘米就值得你警惕。</p>
        <div class="num-cards recap">
          <div class="num-card"><div class="num">5–10 <small>km</small></div><div class="num-label">生成高度</div></div>
          <div class="num-card"><div class="num">10–40+ <small>m/s</small></div><div class="num-label">落地速度</div></div>
          <div class="num-card"><div class="num">⌀2 <small>cm</small></div><div class="num-label">危险起点</div></div>
        </div>
        <p class="credits">数据为典型范围，详见正文 · Vite + GSAP 手工打造</p>
      </div>
    </section>

  </main>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `src/styles/tokens.css`**

```css
:root {
  /* 色彩弧线四站（与 background/sky.ts 的 STOPS 一致） */
  --c-sky-top: #1a2b4a;
  --c-sky-mid: #2d4a73;
  --c-sky-low: #7da7cf;
  --c-sky-ground: #e9f4fb;

  --c-ink-dark: #13294a;   /* 亮背景上的文字 */
  --c-ink-light: #eaf3ff;  /* 暗背景上的文字 */
  --c-ink-light-2: #b8cce8;
  --c-accent: #ffd84d;
  --c-danger: #e8503a;
  --c-ice: #bfe3ff;
  --c-card-dark: rgba(191, 227, 255, 0.08);
  --c-card-light: rgba(255, 255, 255, 0.72);

  --fs-hero: clamp(40px, 8vw, 88px);
  --fs-h2: clamp(28px, 4.5vw, 44px);
  --fs-num: clamp(32px, 5vw, 56px);
  --fs-body: clamp(15px, 1.8vw, 18px);

  --maxw: 1080px;
  --radius: 16px;
  --font: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
}
```

- [ ] **Step 3: 创建 `src/styles/base.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font);
  font-size: var(--fs-body);
  line-height: 1.8;
  /* 无 JS 时的兜底背景（JS 会注入 #sky 固定层盖住它） */
  background: linear-gradient(180deg, var(--c-sky-top), var(--c-sky-low) 70%, var(--c-sky-ground));
  overflow-x: hidden;
}

/* JS 注入的固定背景层 */
#sky {
  position: fixed;
  inset: 0;
  z-index: -2;
}

h1, h2, h3 {
  line-height: 1.25;
  font-weight: 800;
}

button {
  font-family: inherit;
  cursor: pointer;
}

.on-dark { color: var(--c-ink-light); }
.on-light { color: var(--c-ink-dark); }

.scene {
  position: relative;
  min-height: 100vh;
  padding: 12vh 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scene-inner {
  width: 100%;
  max-width: var(--maxw);
  position: relative;
  z-index: 1;
}

.scene-inner.center { text-align: center; }

/* 场景内通铺 Canvas（hero 粒子等） */
.scene-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

h2 { font-size: var(--fs-h2); margin-bottom: 0.6em; }

.ch-no {
  display: block;
  font-size: 0.4em;
  font-weight: 600;
  letter-spacing: 0.4em;
  opacity: 0.65;
  margin-bottom: 0.4em;
}

.lead { max-width: 46em; margin-bottom: 2em; }

.note {
  font-size: 0.82em;
  opacity: 0.6;
  margin-top: 1.5em;
}

.kicker {
  font-size: 13px;
  letter-spacing: 0.5em;
  opacity: 0.7;
  margin-bottom: 1.2em;
}
```

- [ ] **Step 4: 创建 `src/styles/sections.css`**

```css
/* ===== 高度尺（JS 注入） ===== */
#ruler {
  position: fixed;
  top: 8vh;
  bottom: 8vh;
  right: 18px;
  width: 56px;
  z-index: 10;
}

.ruler-track {
  position: relative;
  height: 100%;
  border-right: 2px solid rgba(255, 255, 255, 0.35);
}

.ruler-mark {
  position: absolute;
  right: 6px;
  transform: translateY(-50%);
  font-size: 11px;
  white-space: nowrap;
  opacity: 0.45;
  transition: opacity 0.3s, transform 0.3s;
}

.ruler-mark.active {
  opacity: 1;
  transform: translateY(-50%) scale(1.15);
}

.ruler-indicator {
  position: absolute;
  right: -8px;
  transform: translateY(-50%);
  background: var(--c-accent);
  color: #1a2b4a;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

/* ===== HERO ===== */
#hero { text-align: center; }

.hero-title {
  font-size: var(--fs-hero);
  letter-spacing: 0.08em;
  text-shadow: 0 0 32px rgba(120, 170, 255, 0.45);
}

.hero-mascot-slot { display: flex; justify-content: center; margin: 24px 0; }

.num-cards {
  display: flex;
  gap: 18px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 32px 0;
}

.num-card {
  background: var(--c-card-dark);
  border: 1px solid rgba(191, 227, 255, 0.25);
  border-radius: var(--radius);
  padding: 20px 26px;
  min-width: 200px;
  text-align: center;
}

.on-light .num-card,
#ending .num-card {
  background: var(--c-card-light);
  border-color: rgba(19, 41, 74, 0.12);
}

.num { font-size: var(--fs-num); font-weight: 800; line-height: 1.1; }
.num small { font-size: 0.45em; font-weight: 600; opacity: 0.75; }
.num-label { font-weight: 700; letter-spacing: 0.2em; margin-top: 6px; opacity: 0.85; }
.num-card p { font-size: 0.78em; opacity: 0.7; margin-top: 8px; }

.scroll-hint { opacity: 0.7; letter-spacing: 0.15em; }

/* ===== 第一章 ===== */
.ch1-stage { margin: 0 auto; max-width: 720px; }
.cloud-svg { width: 100%; height: auto; display: block; }
.melt-note { max-width: 46em; }
.melt-demo { font-size: 1.4em; margin-left: 0.5em; }

/* ===== 第二章 竞速 ===== */
.race { margin: 3em 0; }

.race-track {
  display: flex;
  gap: 8px;
  height: 52vh;
  min-height: 360px;
}

.lane {
  flex: 1;
  position: relative;
  border-radius: 12px;
  background: rgba(191, 227, 255, 0.06);
  border: 1px dashed rgba(191, 227, 255, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.race-dial {
  font-weight: 800;
  font-size: clamp(14px, 2vw, 22px);
  color: var(--c-accent);
  padding: 10px 0 4px;
}

.race-ball {
  width: var(--d);
  height: var(--d);
  border-radius: 50%;
  background: #eef8ff;
  border: 3px solid #9fcbe8;
  margin-top: 6px;
}

.lane-label {
  position: absolute;
  bottom: 8px;
  font-size: 12px;
  opacity: 0.75;
}

.race-replay {
  margin-top: 14px;
  background: transparent;
  color: var(--c-ice);
  border: 1px solid rgba(191, 227, 255, 0.5);
  border-radius: 999px;
  padding: 8px 22px;
  font-size: 14px;
}

.race-replay:hover { background: rgba(191, 227, 255, 0.12); }

.formula {
  color: var(--c-accent);
  font-weight: 700;
  display: inline-block;
}

.speed-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.speed-table th,
.speed-table td {
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(191, 227, 255, 0.18);
}

.speed-table th {
  font-size: 0.8em;
  letter-spacing: 0.2em;
  opacity: 0.6;
}

/* ===== 第三章 ===== */
.size-ladder {
  display: flex;
  align-items: flex-end;
  gap: 9%;
  margin: 2.5em 0 1em;
  padding: 0 4%;
}

.size-item { text-align: center; }

.size-dot {
  display: block;
  width: var(--d);
  height: var(--d);
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #9fcbe8;
  box-shadow: 0 4px 14px rgba(19, 41, 74, 0.18);
}

.size-name { font-size: 12px; opacity: 0.8; }

.danger-band {
  position: relative;
  height: 14px;
  border-radius: 999px;
  margin: 0 4% 3em;
  background: linear-gradient(90deg, #7ac96f, #ffd84d 38%, #f29b38 66%, #e8503a);
}

.danger-pointer {
  position: absolute;
  top: -7px;
  left: 4%;
  width: 4px;
  height: 28px;
  border-radius: 2px;
  background: var(--c-ink-dark);
}

.energy-bars { display: grid; gap: 22px; margin: 2em 0; }

.energy-bar {
  display: grid;
  grid-template-columns: 160px 1fr 90px;
  gap: 14px;
  align-items: center;
}

.energy-bar p {
  grid-column: 2 / 4;
  font-size: 0.82em;
  opacity: 0.75;
}

.energy-head { font-weight: 700; font-size: 0.9em; }

.energy-track {
  height: 22px;
  border-radius: 999px;
  background: rgba(19, 41, 74, 0.1);
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #f29b38, var(--c-danger));
}

.energy-num { font-weight: 800; font-size: 1.3em; }

.history-card {
  background: #1c2433;
  color: #dce6f5;
  border-radius: var(--radius);
  padding: 26px 30px;
  margin: 2.5em 0;
  display: flex;
  gap: 22px;
  align-items: center;
  transition: opacity 0.4s;
}

.history-card h3 { margin-bottom: 0.3em; }

.safety-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.safety-card {
  background: var(--c-card-light);
  border: 1px solid rgba(19, 41, 74, 0.12);
  border-radius: var(--radius);
  padding: 22px 24px;
  position: relative;
}

.safety-card h3 { margin-bottom: 0.4em; }

.safety-mascot-slot { position: absolute; right: 14px; bottom: 10px; }

.season-tip {
  margin-top: 2em;
  font-weight: 600;
}

/* ===== 第四章 实验室 ===== */
.lab {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 26px;
  align-items: stretch;
}

.lab-controls {
  background: var(--c-card-light);
  border: 1px solid rgba(19, 41, 74, 0.12);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.lab-controls label {
  font-weight: 700;
  font-size: 0.9em;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lab-controls output {
  float: right;
  font-weight: 800;
  color: #1f5fa8;
}

.lab-controls input[type='range'] { width: 100%; accent-color: #1f5fa8; }

.lab-presets { display: flex; flex-wrap: wrap; gap: 8px; }

.lab-presets button {
  border: 1px solid rgba(19, 41, 74, 0.25);
  background: #fff;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px;
}

.lab-presets button:hover { background: #eaf3ff; }

.lab-mascot-slot { margin-top: auto; align-self: center; }

.lab-stage {
  position: relative;
  border-radius: var(--radius);
  background: linear-gradient(180deg, #9cc3e4, #dceaf6);
  overflow: hidden;
  min-height: 420px;
}

.lab-cloud {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 84px;
  border-radius: 999px;
  background: #e8f2fb;
  box-shadow: -60px 16px 0 -10px #e8f2fb, 70px 18px 0 -14px #e8f2fb;
}

.lab-cloud-shade {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #2d3c52;
  opacity: 0.2; /* JS 随上升气流强度调整 */
}

#lab-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.lab-outcome {
  position: absolute;
  left: 18px;
  bottom: 18px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 12px;
  padding: 14px 18px;
}

.lab-outcome-emoji { font-size: 40px; line-height: 1; }
.lab-outcome-label { font-weight: 800; font-size: 1.1em; margin: 4px 0 10px; }

.lab-outcome dl div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  font-size: 12.5px;
}

.lab-outcome dt { opacity: 0.6; }
.lab-outcome dd { font-weight: 700; }

/* ===== 结尾 ===== */
.ending-stage {
  position: relative;
  height: 220px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin: 1em 0 2em;
}

.ending-mascot-slot { position: relative; z-index: 1; }

.puddle {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 22px;
  border-radius: 50%;
  background: rgba(127, 200, 235, 0.65);
}

.grass {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, 90%);
  height: 10px;
  border-radius: 999px;
  background: #7ac96f;
}

.credits { font-size: 0.8em; opacity: 0.55; margin-top: 3em; }
```

- [ ] **Step 5: 在 `src/main.ts` 中临时引入样式验证（Task 13 会重写）**

```ts
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

console.log('hail: static skeleton ok');
```

- [ ] **Step 6: 视觉验证**

```bash
npm run dev
```

浏览器打开 http://localhost:5173 预期：六个章节从上到下完整可读（标题、三卡片、云剖面 SVG、四条竞速赛道、速度表、尺寸阶梯、能量条、实验室滑杆、结尾回顾）；无 JS 动画但布局完好；console 无报错。

- [ ] **Step 7: Commit**

```bash
git add index.html src/styles/ src/main.ts
git commit -m "feat: 六章静态骨架与全部样式（无 JS 可读）"
```

---

### Task 5: 背景贯穿层（天空渐变 + 高度尺）

**Files:**
- Create: `src/background/sky.ts`
- Create: `src/background/ruler.ts`
- Modify: `src/main.ts`（追加两行初始化，便于本任务验证）

- [ ] **Step 1: 创建 `src/background/sky.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 色彩弧线（与 tokens.css 中的 --c-sky-* 一致）
const STOPS = [
  { p: 0.0, c: '#1a2b4a' },
  { p: 0.3, c: '#2d4a73' },
  { p: 0.65, c: '#7da7cf' },
  { p: 1.0, c: '#e9f4fb' },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

export function skyColorAt(p: number): string {
  const clamped = Math.min(1, Math.max(0, p));
  for (let i = 1; i < STOPS.length; i++) {
    if (clamped <= STOPS[i].p) {
      const t = (clamped - STOPS[i - 1].p) / (STOPS[i].p - STOPS[i - 1].p);
      return lerpColor(STOPS[i - 1].c, STOPS[i].c, t);
    }
  }
  return STOPS[STOPS.length - 1].c;
}

export function initSky(): void {
  const el = document.createElement('div');
  el.id = 'sky';
  document.body.prepend(el);
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const top = skyColorAt(self.progress);
      const bottom = skyColorAt(self.progress + 0.08);
      el.style.background = `linear-gradient(180deg, ${top}, ${bottom})`;
    },
  });
}
```

- [ ] **Step 2: 创建 `src/background/ruler.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { rulerMarks } from '../content';

export function initRuler(): void {
  const ruler = document.createElement('aside');
  ruler.id = 'ruler';
  ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = `
    <div class="ruler-track">
      ${rulerMarks
        .map(
          (m) =>
            `<div class="ruler-mark" data-km="${m.km}" style="top:${(1 - m.km / 10) * 100}%"><span>${m.label}</span></div>`,
        )
        .join('')}
      <div class="ruler-indicator"><b class="ruler-alt">10.0</b> km</div>
    </div>`;
  document.body.appendChild(ruler);

  const indicator = ruler.querySelector<HTMLElement>('.ruler-indicator')!;
  const altEl = ruler.querySelector<HTMLElement>('.ruler-alt')!;
  const marks = Array.from(ruler.querySelectorAll<HTMLElement>('.ruler-mark'));

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const alt = 10 * (1 - self.progress); // 滚动进度 0→1 映射高度 10km→0m
      indicator.style.top = `${(1 - alt / 10) * 100}%`;
      altEl.textContent = alt.toFixed(1);
      for (const m of marks) {
        m.classList.toggle('active', Math.abs(Number(m.dataset.km) - alt) < 0.6);
      }
    },
  });
}
```

- [ ] **Step 3: `src/main.ts` 追加初始化（临时形态）**

```ts
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSky } from './background/sky';
import { initRuler } from './background/ruler';

gsap.registerPlugin(ScrollTrigger);
initSky();
initRuler();
```

- [ ] **Step 4: 验证**

```bash
npm run typecheck && npm run dev
```

浏览器预期：滚动时整页背景从深蓝渐变到亮蓝；右侧高度尺指示牌从 10.0 km 平滑降到 0.0 km；滚过 8.8 km 时"⛰️ 珠峰"标记放大点亮，其余参照物同理；console 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/background/ src/main.ts
git commit -m "feat: 背景贯穿层——天空色彩弧线与高度尺"
```

---

### Task 6: 工具模块（降级开关 / 数字滚动 / 粒子场）

**Files:**
- Create: `src/utils/motion.ts`
- Create: `src/utils/counter.ts`
- Create: `src/utils/particles.ts`

- [ ] **Step 1: 创建 `src/utils/motion.ts`**

```ts
// 降级与设备开关（规格 §7）
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Canvas 粒子限额：桌面 300 / 移动 120
export const particleCap = isMobile ? 120 : 300;
```

- [ ] **Step 2: 创建 `src/utils/counter.ts`**

```ts
import { gsap } from 'gsap';

export interface RollOptions {
  duration?: number;
  decimals?: number;
  suffix?: string;
}

/** 数字滚动动画：el 的文本从 0 滚到 to */
export function rollNumber(el: HTMLElement, to: number, opts: RollOptions = {}): gsap.core.Tween {
  const obj = { v: 0 };
  return gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.2,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = obj.v.toFixed(opts.decimals ?? 0) + (opts.suffix ?? '');
    },
  });
}
```

- [ ] **Step 3: 创建 `src/utils/particles.ts`**

```ts
export type ParticleMode = 'off' | 'hail-light' | 'rain' | 'small-hail' | 'hail' | 'giant-hail';

interface P {
  x: number;
  y: number;
  vy: number;
  r: number;
}

const MODES: Record<
  Exclude<ParticleMode, 'off'>,
  { count: number; rMin: number; rMax: number; vMin: number; vMax: number; streak: boolean }
> = {
  'hail-light': { count: 90, rMin: 2, rMax: 5, vMin: 3, vMax: 6, streak: false },
  rain: { count: 160, rMin: 1, rMax: 1.6, vMin: 9, vMax: 13, streak: true },
  'small-hail': { count: 110, rMin: 1.5, rMax: 3, vMin: 5, vMax: 8, streak: false },
  hail: { count: 90, rMin: 4, rMax: 7, vMin: 8, vMax: 11, streak: false },
  'giant-hail': { count: 36, rMin: 9, rMax: 16, vMin: 11, vMax: 15, streak: false },
};

export class ParticleField {
  private ps: P[] = [];
  private mode: ParticleMode = 'off';
  private raf = 0;
  private ctx: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private cap = 300,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  setMode(mode: ParticleMode): void {
    this.mode = mode;
    this.ps = [];
  }

  start(): void {
    if (!this.raf) this.tick();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const { width: w, height: h } = this.canvas;
    this.ctx.clearRect(0, 0, w, h);
    if (this.mode === 'off') return;

    const cfg = MODES[this.mode];
    const target = Math.min(cfg.count, this.cap);
    while (this.ps.length < target) {
      this.ps.push({
        x: Math.random() * w,
        y: Math.random() * -h,
        vy: cfg.vMin + Math.random() * (cfg.vMax - cfg.vMin),
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
      });
    }
    if (this.ps.length > target) this.ps.length = target;

    this.ctx.fillStyle = 'rgba(238,248,255,0.92)';
    this.ctx.strokeStyle = 'rgba(160,200,235,0.8)';
    this.ctx.lineWidth = 1.5;
    for (const p of this.ps) {
      p.y += p.vy;
      if (p.y - p.r > h) {
        p.y = -p.r * 2;
        p.x = Math.random() * w;
      }
      if (cfg.streak) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x, p.y + p.r * 8);
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  };
}
```

- [ ] **Step 4: 验证类型**

```bash
npm run typecheck
```

预期：零报错（运行时效果在 Task 8/12 接入后验证）。

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: 工具模块——motion 开关、数字滚动、Canvas 粒子场"
```

---

### Task 7: 雹宝吉祥物模块

**Files:**
- Create: `src/mascot/mascot.ts`
- Modify: `src/styles/sections.css`（文件末尾追加 `.mascot-wrap` 规则）

- [ ] **Step 1: 创建 `src/mascot/mascot.ts`**

```ts
export type Expression = 'happy' | 'scared' | 'solemn' | 'safety' | 'lab';

export interface Mascot {
  el: HTMLDivElement;
  setExpression(e: Expression): void;
}

const TEMPLATE = `
<svg viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="44" fill="#eef8ff" stroke="#9fcbe8" stroke-width="5"/>
  <path d="M60 24 a36 36 0 0 1 36 36" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>
  <path d="M60 36 a24 24 0 0 1 24 24" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>
  <g data-part="eyes-open">
    <circle cx="46" cy="54" r="5" fill="#222"/>
    <circle cx="74" cy="54" r="5" fill="#222"/>
  </g>
  <g data-part="eyes-closed" style="display:none">
    <path d="M40 54 h12 M68 54 h12" stroke="#222" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>
  <path data-part="mouth" d="M48 74 Q60 84 72 74" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>
  <g data-part="helmet" style="display:none">
    <path d="M28 46 a32 32 0 0 1 64 0 z" fill="#ffd84d" stroke="#d9a72e" stroke-width="3"/>
    <rect x="24" y="44" width="72" height="8" rx="4" fill="#d9a72e"/>
  </g>
  <g data-part="goggles" style="display:none">
    <rect x="36" y="44" width="20" height="16" rx="6" fill="#bfe3ff" stroke="#222" stroke-width="3"/>
    <rect x="64" y="44" width="20" height="16" rx="6" fill="#bfe3ff" stroke="#222" stroke-width="3"/>
    <path d="M56 52 h8" stroke="#222" stroke-width="3"/>
  </g>
</svg>`;

// 各表情的嘴形（SVG path d）
const MOUTHS: Record<Expression, string> = {
  happy: 'M48 74 Q60 84 72 74',
  scared: 'M54 76 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0',
  solemn: 'M50 78 h20',
  safety: 'M48 74 Q60 84 72 74',
  lab: 'M48 76 Q60 82 72 76',
};

export function createMascot(sizePx = 96, expression: Expression = 'happy'): Mascot {
  const el = document.createElement('div');
  el.className = 'mascot-wrap';
  el.style.width = `${sizePx}px`;
  el.style.height = `${sizePx}px`;
  el.innerHTML = TEMPLATE;

  const q = <T extends Element>(sel: string): T => el.querySelector<T>(sel)!;
  const mouth = q<SVGPathElement>('[data-part="mouth"]');
  const eyesOpen = q<SVGGElement>('[data-part="eyes-open"]');
  const eyesClosed = q<SVGGElement>('[data-part="eyes-closed"]');
  const helmet = q<SVGGElement>('[data-part="helmet"]');
  const goggles = q<SVGGElement>('[data-part="goggles"]');

  function setExpression(e: Expression): void {
    mouth.setAttribute('d', MOUTHS[e]);
    eyesOpen.style.display = e === 'solemn' ? 'none' : '';
    eyesClosed.style.display = e === 'solemn' ? '' : 'none';
    helmet.style.display = e === 'safety' ? '' : 'none';
    goggles.style.display = e === 'lab' ? '' : 'none';
  }

  setExpression(expression);
  return { el, setExpression };
}
```

设计决定：规格里"穿白大褂的雹宝"在圆形身体上无处安放大褂，实验室装扮以**护目镜**（`lab` 表情）代表，属有意简化。

- [ ] **Step 2: `src/styles/sections.css` 末尾追加**

```css
/* ===== 雹宝 ===== */
.mascot-wrap { display: inline-block; }
.mascot-wrap svg { width: 100%; height: 100%; display: block; }
```

- [ ] **Step 3: 验证类型**

```bash
npm run typecheck
```

预期：零报错（视觉效果随 Task 8 接入 hero 后验证）。

- [ ] **Step 4: Commit**

```bash
git add src/mascot/ src/styles/sections.css
git commit -m "feat: 雹宝吉祥物——五种表情与配件切换"
```

---

### Task 8: Hero 场景

**Files:**
- Create: `src/scenes/hero.ts`
- Modify: `src/main.ts`（追加 `initHero` 调用，便于本任务验证）

- [ ] **Step 1: 创建 `src/scenes/hero.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';

export function initHero(section: HTMLElement): void {
  // 背景粒子（轻量冰雹雨），仅在 hero 可见时运行
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  section.prepend(canvas);
  const field = new ParticleField(canvas, particleCap);

  if (!reducedMotion) {
    field.setMode('hail-light');
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => field.start(),
      onEnterBack: () => field.start(),
      onLeave: () => field.stop(),
      onLeaveBack: () => field.stop(),
    });
    field.start();
  }

  // 雹宝砸场
  const mascot = createMascot(110, 'scared');
  section.querySelector('.hero-mascot-slot')!.appendChild(mascot.el);

  if (reducedMotion) {
    mascot.setExpression('happy');
    return;
  }

  const inner = section.querySelector<HTMLElement>('.hero-inner')!;
  const cards = section.querySelectorAll('.num-card');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(section.querySelector('.hero-title'), { y: -120, opacity: 0, duration: 0.7 })
    .from(mascot.el, { y: -400, duration: 0.6, ease: 'bounce.out' }, '-=0.3')
    // 落地挤压回弹
    .to(mascot.el, { scaleY: 0.8, scaleX: 1.15, transformOrigin: '50% 100%', duration: 0.1 })
    .to(mascot.el, { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'back.out(3)' })
    .add(() => mascot.setExpression('happy'))
    .from(cards, { y: 60, opacity: 0, scale: 0.85, stagger: 0.15, duration: 0.5 }, '-=0.1')
    .from(section.querySelector('.scroll-hint'), { opacity: 0, duration: 0.6 });

  // 滚动离场视差
  gsap.to(inner, {
    opacity: 0,
    y: -80,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 40%', scrub: true },
  });
}
```

注意：hero 卡片数字是范围值（"5–10"），设计上不做滚动，所以本场景不引入 `rollNumber`（`noUnusedLocals` 开着，未使用的 import 会让 typecheck 失败）。

- [ ] **Step 2: `src/main.ts` 追加**

```ts
import { initHero } from './scenes/hero';

const hero = document.querySelector<HTMLElement>('#hero');
if (hero) initHero(hero);
```

- [ ] **Step 3: 验证**

```bash
npm run typecheck && npm run dev
```

浏览器预期：刷新后标题从上方落入；雹宝从天而降、落地挤压回弹、表情从惊恐变开心；三张卡片依次弹出；hero 区有稀疏冰雹粒子下落；向下滚动时 hero 内容淡出上移；console 无报错。

- [ ] **Step 4: Commit**

```bash
git add src/scenes/hero.ts src/main.ts
git commit -m "feat: Hero 场景——雹宝砸场与三结论卡片"
```

---

### Task 9: 第一章 生成高度（pin + scrub 翻滚生长）

**Files:**
- Create: `src/scenes/ch1-height.ts`
- Modify: `src/main.ts`（追加 `initCh1` 调用）

- [ ] **Step 1: 创建 `src/scenes/ch1-height.ts`**

```ts
import { gsap } from 'gsap';
import { reducedMotion } from '../utils/motion';

export function initCh1(section: HTMLElement): void {
  const embryo = section.querySelector<SVGCircleElement>('.embryo')!;
  const rings = Array.from(section.querySelectorAll<SVGCircleElement>('.onion-ring'));
  const meltNote = section.querySelector<HTMLElement>('.melt-note')!;

  if (reducedMotion) return; // 静态骨架本身已完整可读

  // 初始隐藏洋葱环（无 JS 时它们是可见的，所以由 JS 来隐藏而非 CSS）
  gsap.set(rings, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=2400',
      scrub: 0.5,
      pin: true,
    },
  });

  // ① 云体浮现 + 孕育区高亮
  tl.from(section.querySelector('.cloud-body'), {
    scale: 0.6,
    opacity: 0,
    transformOrigin: '50% 80%',
    duration: 1,
  })
    .from(section.querySelector('.growth-zone'), { opacity: 0, duration: 0.5 })
    .from(section.querySelector('.updraft-arrows'), { opacity: 0, y: 30, duration: 0.5 });

  // ② 四次翻滚：托起→下落，同步长大一圈、洋葱剖面点亮一环
  rings.forEach((ring, i) => {
    tl.to(embryo, { y: -90, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { y: 0, duration: 0.8, ease: 'power1.inOut' })
      .to(embryo, { scale: 1 + (i + 1) * 0.28, transformOrigin: '50% 50%', duration: 0.3 }, '<')
      .to(ring, { opacity: 1, scale: 1, duration: 0.4 }, '<');
  });

  // ③ 融化伏笔：说明浮现，🧊→💧 小同伴抖一下完成"变成水滴"的梗
  tl.from(meltNote, { opacity: 0, y: 40, duration: 0.6 }).from(
    section.querySelector('.melt-demo'),
    { scale: 0, rotation: -20, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' },
  );
}
```

- [ ] **Step 2: `src/main.ts` 追加**

```ts
import { initCh1 } from './scenes/ch1-height';

const ch1 = document.querySelector<HTMLElement>('#ch1');
if (ch1) initCh1(ch1);
```

- [ ] **Step 3: 验证**

```bash
npm run typecheck && npm run dev
```

浏览器预期：滚到第一章时章节钉住（pin）；继续滚动云体浮现→孕育区虚线框点亮→雹胚上下翻滚四次、每次变大一圈、右上洋葱剖面同步多一环→融化说明浮现后章节解钉、继续向下；高度尺同步显示 8–9 km 区间；console 无报错。

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ch1-height.ts src/main.ts
git commit -m "feat: 第一章——积雨云剖面与翻滚生长动画"
```

---

### Task 10: 第二章 坠落竞速

**Files:**
- Create: `src/scenes/ch2-speed.ts`
- Modify: `src/main.ts`（追加 `initCh2` 调用）

- [ ] **Step 1: 创建 `src/scenes/ch2-speed.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { raceLanes } from '../content';
import { rollNumber } from '../utils/counter';
import { isMobile, reducedMotion } from '../utils/motion';

export function initCh2(section: HTMLElement): void {
  const lanes = Array.from(section.querySelectorAll<HTMLElement>('.lane'));
  const replay = section.querySelector<HTMLButtonElement>('.race-replay')!;
  const fastest = Math.max(...raceLanes.map((l) => l.v));

  function run(): void {
    lanes.forEach((lane, i) => {
      const { v } = raceLanes[i];
      const ball = lane.querySelector<HTMLElement>('.race-ball')!;
      const dial = lane.querySelector<HTMLElement>('.race-dial')!;
      // 桌面：纵向下落赛道；移动端（Task 14 将赛道改为上下排列的横向条带）：沿 x 轴竞速
      const axis = isMobile ? 'x' : 'y';
      const dist = isMobile
        ? lane.clientWidth - ball.clientWidth - 130 // 右侧留出标签空间
        : lane.clientHeight - ball.clientHeight - 60; // 底部留出标签空间
      const dur = reducedMotion ? 0.01 : 1.2 * (fastest / v); // 用时 ∝ 1/速度
      gsap.fromTo(ball, { [axis]: 0 }, { [axis]: dist, duration: dur, ease: 'power1.in' });
      rollNumber(dial, Math.round(v * 3.6), { duration: dur, suffix: ' km/h' });
    });
  }

  // 进入视口自动开跑一次，按钮可重赛
  ScrollTrigger.create({ trigger: section, start: 'top 60%', once: true, onEnter: run });
  replay.addEventListener('click', run);

  if (reducedMotion) return;

  // 公式描线式显现
  gsap.fromTo(
    section.querySelector('.formula'),
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.2,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: section, start: 'top 70%' },
    },
  );

  // 速度表逐行点亮
  gsap.from(section.querySelectorAll('.speed-row'), {
    opacity: 0,
    x: -40,
    stagger: 0.2,
    scrollTrigger: { trigger: section.querySelector('.speed-table'), start: 'top 80%' },
  });
}
```

- [ ] **Step 2: `src/main.ts` 追加**

```ts
import { initCh2 } from './scenes/ch2-speed';

const ch2 = document.querySelector<HTMLElement>('#ch2');
if (ch2) initCh2(ch2);
```

- [ ] **Step 3: 验证**

```bash
npm run typecheck && npm run dev
```

浏览器预期：滚到第二章，四颗冰雹自动同时起跑——垒球最先砸到底（约 1.2s），黄豆最慢（约 4.8s）；每条赛道上方 km/h 数字随下落滚动到 35/63/99/144；「↻ 再比一次」可重赛；公式从左到右扫出；表格四行依次点亮；console 无报错。

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ch2-speed.ts src/main.ts
git commit -m "feat: 第二章——坠落竞速与速度表动画"
```

---

### Task 11: 第三章 危险阈值

**Files:**
- Create: `src/scenes/ch3-danger.ts`
- Modify: `src/styles/sections.css`（文件末尾追加 `.dimmed` 规则）
- Modify: `src/main.ts`（追加 `initCh3` 调用）

- [ ] **Step 1: 创建 `src/scenes/ch3-danger.ts`**

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMascot } from '../mascot/mascot';
import { rollNumber } from '../utils/counter';
import { reducedMotion } from '../utils/motion';

export function initCh3(section: HTMLElement): void {
  // 历史卡片里的雹宝（默哀）与安全卡里的雹宝（戴盔）
  const historyMascot = createMascot(84, 'happy');
  section.querySelector('.history-mascot-slot')!.appendChild(historyMascot.el);
  const safetyMascot = createMascot(64, 'safety');
  section.querySelector('.safety-mascot-slot')!.appendChild(safetyMascot.el);

  if (reducedMotion) {
    historyMascot.setExpression('solemn');
    section.querySelectorAll<HTMLElement>('.energy-fill').forEach((f, i) => {
      f.style.width = i === 0 ? '12%' : '92%';
    });
    return;
  }

  // ① 尺寸阶梯弹入
  gsap.from(section.querySelectorAll('.size-item'), {
    scale: 0,
    transformOrigin: '50% 100%',
    stagger: 0.18,
    ease: 'back.out(2)',
    scrollTrigger: { trigger: section.querySelector('.size-ladder'), start: 'top 72%' },
  });

  // ② 危险色带指针随滚动右移（绿→红）
  gsap.fromTo(
    section.querySelector('.danger-pointer'),
    { left: '4%' },
    {
      left: '94%',
      ease: 'none',
      scrollTrigger: {
        trigger: section.querySelector('.size-ladder'),
        start: 'top 72%',
        end: 'bottom 30%',
        scrub: true,
      },
    },
  );

  // ③ 能量条增长 + 焦耳数滚动
  const energyTargets: Array<{ sel: string; joules: number; width: string }> = [
    { sel: '.energy-20', joules: 20, width: '12%' },
    { sel: '.energy-170', joules: 170, width: '92%' },
  ];
  for (const { sel, joules, width } of energyTargets) {
    const bar = section.querySelector<HTMLElement>(sel)!;
    const fill = bar.querySelector<HTMLElement>('.energy-fill')!;
    const num = bar.querySelector<HTMLElement>('.energy-num')!;
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.to(fill, { width, duration: 1.4, ease: 'power2.out' });
        rollNumber(num, joules, { duration: 1.4, suffix: ' J' });
      },
    });
  }

  // ④ 历史卡片：进入时整章压暗、雹宝默哀；往回滚恢复
  ScrollTrigger.create({
    trigger: section.querySelector('.history-card'),
    start: 'top 70%',
    onEnter() {
      historyMascot.setExpression('solemn');
      section.classList.add('dimmed');
    },
    onLeaveBack() {
      historyMascot.setExpression('happy');
      section.classList.remove('dimmed');
    },
  });

  // ⑤ 安全卡滑入
  gsap.from(section.querySelectorAll('.safety-card'), {
    y: 60,
    opacity: 0,
    stagger: 0.18,
    scrollTrigger: { trigger: section.querySelector('.safety-cards'), start: 'top 80%' },
  });
}
```

- [ ] **Step 2: `src/styles/sections.css` 末尾追加**

```css
/* 第三章历史卡片在场时整章收敛 */
#ch3.dimmed .size-ladder,
#ch3.dimmed .danger-band,
#ch3.dimmed .energy-bars {
  opacity: 0.45;
  transition: opacity 0.5s;
}
```

- [ ] **Step 3: `src/main.ts` 追加**

```ts
import { initCh3 } from './scenes/ch3-danger';

const ch3 = document.querySelector<HTMLElement>('#ch3');
if (ch3) initCh3(ch3);
```

- [ ] **Step 4: 验证**

```bash
npm run typecheck && npm run dev
```

浏览器预期：四个尺寸圆点从小到大依次弹入；危险色带指针随滚动从绿区滑向红区；两条能量条先后涨起、焦耳数滚到 20 J / 170 J；滚到历史卡片时上方内容压暗、雹宝闭眼默哀（回滚恢复笑脸）；两张安全卡滑入、卡内雹宝戴着黄色安全帽；console 无报错。

- [ ] **Step 5: Commit**

```bash
git add src/scenes/ch3-danger.ts src/styles/sections.css src/main.ts
git commit -m "feat: 第三章——尺寸阶梯、动能可视化与安全卡"
```

---

### Task 12: 第四章 冰雹实验室

**Files:**
- Create: `src/scenes/ch4-lab.ts`
- Modify: `src/main.ts`（追加 `initCh4` 调用）

- [ ] **Step 1: 创建 `src/scenes/ch4-lab.ts`**

```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { labPresets, outcomeMeta } from '../content';
import { simulate } from '../lab/model';
import type { Outcome } from '../lab/model';
import { createMascot } from '../mascot/mascot';
import { particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';
import type { ParticleMode } from '../utils/particles';

const OUTCOME_MODE: Record<Outcome, ParticleMode> = {
  rain: 'rain',
  'small-hail': 'small-hail',
  hail: 'hail',
  'giant-hail': 'giant-hail',
};

export function initCh4(section: HTMLElement): void {
  const wInput = section.querySelector<HTMLInputElement>('#lab-w')!;
  const hInput = section.querySelector<HTMLInputElement>('#lab-h0')!;
  const wOut = section.querySelector<HTMLOutputElement>('#lab-w-out')!;
  const hOut = section.querySelector<HTMLOutputElement>('#lab-h0-out')!;
  const emoji = section.querySelector<HTMLElement>('#lab-outcome-emoji')!;
  const label = section.querySelector<HTMLElement>('#lab-outcome-label')!;
  const dmaxEl = section.querySelector<HTMLElement>('#lab-dmax')!;
  const dfinalEl = section.querySelector<HTMLElement>('#lab-dfinal')!;
  const vlandEl = section.querySelector<HTMLElement>('#lab-vland')!;
  const cloudShade = section.querySelector<HTMLElement>('.lab-cloud-shade')!;
  const canvas = section.querySelector<HTMLCanvasElement>('#lab-canvas')!;

  // 实验室助手雹宝（白大褂护目镜）
  const mascot = createMascot(96, 'lab');
  section.querySelector('.lab-mascot-slot')!.appendChild(mascot.el);

  const field = new ParticleField(canvas, particleCap);

  // 仅当实验室在视口内时运行粒子
  if (!reducedMotion) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => field.start(),
      onEnterBack: () => field.start(),
      onLeave: () => field.stop(),
      onLeaveBack: () => field.stop(),
    });
  }

  function update(): void {
    const w = Number(wInput.value);
    const h0 = Number(hInput.value);
    wOut.textContent = `${w} m/s`;
    hOut.textContent = `${h0.toFixed(1)} km`;

    const r = simulate(w, h0);
    const meta = outcomeMeta[r.outcome];
    emoji.textContent = meta.emoji;
    label.textContent = meta.label;
    label.style.color = meta.tone;
    dmaxEl.textContent = `${r.maxDiameterCm.toFixed(1)} cm`;
    dfinalEl.textContent = r.outcome === 'rain' ? '—（全化了）' : `${r.finalDiameterCm.toFixed(1)} cm`;
    vlandEl.textContent = r.outcome === 'rain' ? '—' : `${r.landingSpeedMs.toFixed(0)} m/s`;

    // 云越"凶"越暗：上升气流 5→50 映射阴影透明度 0.1→0.75
    cloudShade.style.opacity = String(0.1 + ((w - 5) / 45) * 0.65);

    if (!reducedMotion) field.setMode(OUTCOME_MODE[r.outcome]);
  }

  wInput.addEventListener('input', update);
  hInput.addEventListener('input', update);

  // 预设按钮：单一数据源 content.ts → labPresets
  const presetBox = section.querySelector<HTMLElement>('.lab-presets')!;
  for (const p of labPresets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.name;
    btn.addEventListener('click', () => {
      wInput.value = String(p.w);
      hInput.value = String(p.h0);
      update();
    });
    presetBox.appendChild(btn);
  }

  update(); // 初始状态（25 m/s, 4.0 km）→ final≈3.0 cm → 🧊 危险冰雹
}
```

- [ ] **Step 2: `src/main.ts` 追加**

```ts
import { initCh4 } from './scenes/ch4-lab';

const ch4 = document.querySelector<HTMLElement>('#ch4');
if (ch4) initCh4(ch4);
```

- [ ] **Step 3: 验证（对照单测过的模型行为）**

```bash
npm run typecheck && npm test && npm run dev
```

浏览器预期：
- 初始 (25, 4.0)：🧊 或 🌨（以 simulate 输出为准），面板显示雹径与落速数字
- 拖「上升气流」到 50：结局变 💀 巨雹警报，粒子变成大颗慢速冰雹，云影明显变暗
- 点「典型雷阵雨」：☔ 只下暴雨，粒子变细长雨丝，落地直径显示"—（全化了）"
- 点「强对流冰雹日」：🧊 危险冰雹；点「1986 孟加拉」：💀，落地速度 ≈ 40 m/s
- 雹宝戴护目镜坐在控制面板下方；console 无报错

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ch4-lab.ts src/main.ts
git commit -m "feat: 第四章——冰雹实验室交互（滑杆/预设/实时粒子）"
```

---

### Task 13: 结尾场景 + main.ts 总装定稿

**Files:**
- Create: `src/scenes/ending.ts`
- Modify: `src/main.ts`（整体重写为最终形态）

- [ ] **Step 1: 创建 `src/scenes/ending.ts`**

```ts
import { gsap } from 'gsap';
import { createMascot } from '../mascot/mascot';
import { reducedMotion } from '../utils/motion';

export function initEnding(section: HTMLElement): void {
  const mascot = createMascot(120, 'happy');
  section.querySelector('.ending-mascot-slot')!.appendChild(mascot.el);
  const puddle = section.querySelector<HTMLElement>('.puddle')!;

  if (reducedMotion) return;

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 60%' },
  });

  tl.from(mascot.el, { y: -260, duration: 0.9, ease: 'bounce.out' })
    // 安全落地，慢慢融化成水洼
    .to(mascot.el, {
      scaleY: 0.22,
      scaleX: 1.35,
      opacity: 0.55,
      transformOrigin: '50% 100%',
      delay: 0.6,
      duration: 1.8,
      ease: 'power2.inOut',
    })
    .from(puddle, { scaleX: 0, transformOrigin: '50% 50%', duration: 1.8 }, '<')
    .from(
      section.querySelectorAll('.recap .num-card'),
      { y: 50, opacity: 0, stagger: 0.15, duration: 0.5 },
      '-=0.6',
    );
}
```

- [ ] **Step 2: 重写 `src/main.ts`（最终形态，替换此前所有追加）**

```ts
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRuler } from './background/ruler';
import { initSky } from './background/sky';
import { initCh1 } from './scenes/ch1-height';
import { initCh2 } from './scenes/ch2-speed';
import { initCh3 } from './scenes/ch3-danger';
import { initCh4 } from './scenes/ch4-lab';
import { initEnding } from './scenes/ending';
import { initHero } from './scenes/hero';

gsap.registerPlugin(ScrollTrigger);

// 背景贯穿层
initSky();
initRuler();

// 六个章节场景：各自独立，缺一个不影响其他
const scenes: Array<[string, (el: HTMLElement) => void]> = [
  ['#hero', initHero],
  ['#ch1', initCh1],
  ['#ch2', initCh2],
  ['#ch3', initCh3],
  ['#ch4', initCh4],
  ['#ending', initEnding],
];

for (const [sel, init] of scenes) {
  const el = document.querySelector<HTMLElement>(sel);
  if (el) init(el);
}
```

- [ ] **Step 3: 全量验证**

```bash
npm run typecheck && npm test && npm run build && npm run dev
```

浏览器预期：从头滚到尾完整体验六章；结尾雹宝弹跳落地→压扁融化成水洼→三张回顾卡浮现；全程背景色弧线与高度尺连贯（10.0 km → 0.0 km）；console 无报错；build 成功。

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ending.ts src/main.ts
git commit -m "feat: 结尾场景与 main.ts 总装"
```

---

### Task 14: 响应式与降级收尾

**Files:**
- Modify: `src/styles/sections.css`（文件末尾追加媒体查询）

JS 侧的 `prefers-reduced-motion` 分支已在各场景内实现（Task 8–13），本任务补 CSS 侧与移动端布局。

- [ ] **Step 1: `src/styles/sections.css` 末尾追加**

```css
/* ===== 移动端（规格 §7）===== */
@media (max-width: 768px) {
  /* 高度尺收窄成色带：藏参照物文字，只留指示牌 */
  #ruler { width: 26px; right: 6px; }
  .ruler-mark span { display: none; }
  .ruler-mark { width: 8px; height: 2px; background: rgba(255, 255, 255, 0.5); }

  .num-cards { gap: 10px; }
  .num-card { min-width: 140px; padding: 14px 16px; }

  /* 竞速改为上下排列的横向条带（规格 §7"纵向轨道"），JS 侧 ch2-speed.ts 按 isMobile 切到 x 轴动画 */
  .race-track { flex-direction: column; height: auto; gap: 10px; }
  .lane { flex-direction: row; align-items: center; min-height: 64px; padding: 0 12px; gap: 12px; }
  .race-dial { padding: 0; min-width: 90px; font-size: 14px; }
  .race-ball { margin-top: 0; }
  .lane-label { position: static; margin-left: auto; font-size: 10px; }

  .size-ladder { gap: 4%; }

  .energy-bar { grid-template-columns: 1fr; gap: 6px; }
  .energy-bar p { grid-column: 1; }

  .safety-cards { grid-template-columns: 1fr; }

  /* 实验室滑杆竖排堆叠 */
  .lab { grid-template-columns: 1fr; }
  .lab-stage { min-height: 340px; }

  .history-card { flex-direction: column; text-align: center; }
}

/* ===== prefers-reduced-motion 的 CSS 兜底 ===== */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .scene-canvas, #lab-canvas { display: none; }
}
```

- [ ] **Step 2: 验证**

```bash
npm run dev
```

浏览器 DevTools 设备模拟（375×812）预期：高度尺只剩细条+指示牌；竞速变为四条上下排列的横向条带、冰雹沿横向赛跑（速度读数在左、标签在右）；卡片、能量条、安全卡、实验室全部单列堆叠不溢出；横向无滚动条。再在 DevTools「Rendering → Emulate CSS prefers-reduced-motion」下刷新：无粒子 Canvas、无 pin 滚动动画、内容全部直接可读。

- [ ] **Step 3: Commit**

```bash
git add src/styles/sections.css
git commit -m "feat: 移动端响应式与 reduced-motion 降级"
```

---

### Task 15: 终验与 README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 全量回归**

```bash
npm test && npm run build
```

预期：8 个单测 PASS；build 零报错，`dist/` 产物生成。

- [ ] **Step 2: 性能走查（规格 §8）**

```bash
npm run preview
```

用 Chrome DevTools 对 preview 地址（默认 http://localhost:4173）：
- Console：全程滚动零报错
- Performance 面板录制一次全页滚动：主线程无长帧（目标桌面 60fps）
- Lighthouse（Performance, Desktop）：得分 ≥ 90；若不足，优先检查粒子数量与 ScrollTrigger scrub 段
- Network：首屏传输 < 500 KB（字体另计）

- [ ] **Step 3: 创建 `README.md`**

```markdown
# 一颗冰雹的诞生与坠落 🧊

纯前端单页滚动科普：用动画把冰雹的三个核心数字具象化——
生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm，
外加一个可以自己调参数的「冰雹实验室」。

## 技术

Vite + TypeScript（无框架）· GSAP/ScrollTrigger · SVG · Canvas 2D · vitest

## 开发

​```bash
npm install
npm run dev        # 开发服务器
npm test           # 实验室物理模型单测
npm run build      # 类型检查 + 产物构建（纯静态，可托管任何静态服务）
​```

设计规格见 `docs/superpowers/specs/2026-06-12-hail-website-design.md`。
```

（注意：写入真实文件时去掉代码块前的零宽转义 `​`。）

- [ ] **Step 4: Commit 并推送**

```bash
git add README.md
git commit -m "docs: README"
git push origin main
```

---

## 完成定义（对照规格 §1 成功标准）

- [ ] 六章节从头滚到尾连贯可玩，三个数字各有"主菜"动画
- [ ] 实验室 8 个单测全绿，预设三场景结局正确
- [ ] `npm run build` 零报错，产物纯静态
- [ ] 桌面滚动流畅（Lighthouse ≥ 90），移动端单列可用
- [ ] reduced-motion / 无 JS 两种降级下内容完整可读

