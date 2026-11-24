# 一颗冰雹的诞生与坠落

纯前端单页滚动科普。页面本身是一张大气剖面图：读者跟着同一颗冰雹从 10 km 落到地面，
沿途看懂三个数字——生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm，
最后在「冰雹实验室」里自己调参数造一场雷暴。

线上地址：<https://hail.bojiangz.com>，支持中文 / 日本語 / English。

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
├── i18n/      # 三语：语言解析、文案替换、日文 / 英文译文、语言选择
└── styles/    # tokens / base / mascot / math + 每章一个 css
tools/
└── katex-prerender.ts   # Vite 插件：把 index.html 里的 data-tex 占位换成静态公式
```

## 开发

```bash
npm install
npm run dev        # 开发服务器
npm test           # 单测：物理模型、旅程锚点、结局地图、舞台几何、公式与模型常数的一致性、三语键值对齐
npm run build      # 类型检查 + 产物构建（纯静态，可托管任何静态服务）
```

## 写公式

在 `index.html` 里放空的占位元素，构建（和 dev）时会被替换成排好版的公式：

```html
<span class="tex" data-tex="v \propto \sqrt{d}"></span>            <!-- 行内 -->
<div class="tex-display" data-tex="E=\tfrac{1}{2}mv^{2}" data-display></div>  <!-- 独立 -->
```

TeX 写错，构建会失败并给出 KaTeX 的报错位置；占位没被转换，构建会失败并报行号。第四章三条模型式子里的常数有单测绑定到 `src/lab/model.ts`，改模型常数而忘了改页面时测试会红。

## 多语言

- 语言选择在 Hero 左上角：跟随系统 / 中文 / 日本語 / English。跟随系统时，系统首选语言是中文系 → 中文、日文 → 日文，其余一律英文。
- 每次打开都跟随系统语言。手动选的语言存在 `sessionStorage`（`hail-lang`），只在当前标签页有效，关掉再开又回到跟随系统。分享链接可以带 `?lang=zh|ja|en`，它优先于手动选择。
- 中文是源文本，直接写在 `index.html` 里，也是无 JS 时的兜底。要翻译的元素加 `data-i18n="key"`（属性用 `data-i18n-attr="aria-label:key"`），日文 / 英文写进 `src/i18n/strings/{ja,en}.ts`。
- 段落里的公式等节点：给它加 `data-slot="f"`，译文里写 `{f}`，原节点会原样搬过去。
- 公式里带汉字的（`\text{冰}` 之类）每种语言各写一份占位，用 `data-tex-lang="zh|ja|en"` 标明，运行时只留当前语言那份。
- `index.html` 头部的内联脚本在任何模块加载前定好语言；非中文时先藏起 `#app`，等 `main.ts` 换完文案再显示（3 秒失效保护会退回中文）。切换语言直接刷新页面，各章按新文案重新测量。
- `tests/i18n.test.ts` 核对：页面上每个键都有日文 / 英文译文、没有多余的键、`{slot}` 对得上、三份公式只差 `\text{…}`。

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
