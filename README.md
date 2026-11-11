# 一颗冰雹的诞生与坠落

纯前端单页滚动科普。页面本身是一张大气剖面图：读者跟着同一颗冰雹从 10 km 落到地面，
沿途看懂三个数字——生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm，
最后在「冰雹实验室」里自己调参数造一场雷暴。

## 页面结构

| 章节 | 高度 | 主菜 |
|---|---|---|
| Hero | 10 km | 雹胚落到高度尺上，之后一路陪读者下落 |
| 第一章 生成高度 | 9.5 → 5.5 km | 积雨云剖面里翻滚四圈，洋葱剖面同步多一环 |
| 第二章 落地速度 | 5 → 1.5 km | 四颗冰雹坠落竞速 + v ∝ √d 曲线图 |
| 第三章 危险阈值 | 1.5 → 0.4 km | 等比例实物阶梯 + 同一把刻度上的三根动能条 |
| 第四章 冰雹实验室 | 0.4 → 0 km | 剖面舞台 + 可点可拖的结局地图 |
| 结尾 | 0 km | 落到草地，融化成水洼 |

右侧高度尺上的冰雹就是主角：读数是当前高度与该高度的气温，它在第一章长大、破云后戴上安全帽、到实验室换护目镜。

雹宝有八种表情，会眨眼、轻轻浮动，落地会挤压回弹；各章里下落的冰雹、雹胚、示范冰雹也都贴着它的脸。
公式用 KaTeX 在构建时预渲染成静态排版——运行时不加载公式库，关掉 JavaScript 也照常显示。

## 技术

Vite + TypeScript（无框架）· GSAP / ScrollTrigger / MotionPath · 内联 SVG · Canvas 2D · KaTeX（仅构建时）· vitest

```
src/
├── journey/   # 旅程层：章节锚点 → 高度的分段映射、文档等高的天空渐变、高度尺与主角
├── scenes/    # 六个场景，各自只暴露 init(el)
├── lab/       # 实验室：物理模型（纯函数）、结局矩阵、舞台几何
├── art/       # 共享内联 SVG 图标
├── mascot/    # 雹宝：表情、装备、待机与一次性反应
└── styles/    # tokens / base / mascot / math + 每章一个 css
tools/
└── katex-prerender.ts   # Vite 插件：把 index.html 里的 data-tex 占位换成静态公式
```

## 开发

```bash
npm install
npm run dev        # 开发服务器
npm test           # 80 个单测：物理模型、旅程锚点、结局地图、舞台几何、公式与模型常数的一致性
npm run build      # 类型检查 + 产物构建（纯静态，可托管任何静态服务）
```

## 写公式

在 `index.html` 里放空的占位元素，构建（和 dev）时会被替换成排好版的公式：

```html
<span class="tex" data-tex="v \propto \sqrt{d}"></span>            <!-- 行内 -->
<div class="tex-display" data-tex="E=\tfrac{1}{2}mv^{2}" data-display></div>  <!-- 独立 -->
```

TeX 写错或占位没被转换，构建会失败并报行号。第四章三条模型式子里的常数有单测绑定到 `src/lab/model.ts`，改模型常数而忘了改页面时测试会红。

## 写动画

- 无限循环只用 CSS keyframes，元素加 `.anim-loop`，并保证它或某个祖先被 `observeInView()` 观察——离屏自动暂停，`prefers-reduced-motion` 下自动关闭。开发模式下漏了观察会在控制台警告。
- 循环和待机不要加在被 GSAP 驱动位移、或被测量的元素上，包一层再加。
- 缓动与时长用 `src/utils/motion.ts` 的 `EASE` / `DUR`。

## 降级

- 无 JavaScript：全部文案与静态图可读（产物里 CSS 是独立文件；dev 模式下 CSS 由 JS 注入，关 JS 测试请用 `npm run build && npm run preview`）
- 模块脚本没跑起来（3 秒失效保护）、迟到，或某一章初始化抛错：内容退回静态排版，其余章节不受影响
- `prefers-reduced-motion`：无 pin、无 scrub、无粒子，直接呈现终态
- 移动端 375px 宽可用，无横向滚动

## 文档

- 设计规格：`docs/superpowers/specs/` 下的 v1 基础（2026-06-12）、v2 变更（2026-11-11-hail-v2-design）、v3 动画与公式（2026-11-11-hail-v3-motion-math）
- 复盘：`docs/superpowers/RETROSPECTIVE-v2.md`、`RETROSPECTIVE-v3.md`
