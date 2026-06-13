# 一颗冰雹的诞生与坠落 🧊

纯前端单页滚动科普：用动画把冰雹的三个核心数字具象化——
生成高度 5–10 km、落地速度 v ∝ √d、危险阈值 ⌀2 cm，
外加一个可以自己调参数的「冰雹实验室」。

## 技术

Vite + TypeScript（无框架）· GSAP/ScrollTrigger · SVG · Canvas 2D · vitest

## 开发

```bash
npm install
npm run dev        # 开发服务器
npm test           # 实验室物理模型单测
npm run build      # 类型检查 + 产物构建（纯静态，可托管任何静态服务）
```

## 无障碍与降级

- 无 JavaScript 时静态骨架仍可读全部文案
- `prefers-reduced-motion` 下关闭粒子与滚动驱动动画，内容直接呈现
- 移动端（< 768px）布局自适应

设计规格见 `docs/superpowers/specs/2026-06-12-hail-website-design.md`。
