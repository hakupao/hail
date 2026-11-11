import katex from 'katex';
import type { Plugin } from 'vite';

// 公式构建时预渲染（v3 规格 §1.1）：把 index.html 里的空占位
//   <span class="tex" data-tex="…"></span>                    行内
//   <div class="tex-display" data-tex="…" data-display></div>  独立公式
// 填成 KaTeX 的静态 HTML + MathML。运行时不加载任何 KaTeX JS，无 JS 时公式照常显示。

const PLACEHOLDER = /(<(span|div)\b[^>]*?\bdata-tex="([^"]*)"[^>]*>)\s*(<\/\2>)/g;

/** TeX 写错会抛错（throwOnError），让 dev 报错、让构建失败 */
export function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { displayMode, output: 'htmlAndMathml', strict: false, throwOnError: true });
}

/** 独立公式里的间距命令折算成 em（\qquad = 2em、\quad = 1em、\; = 5/18em） */
const GAP_EM: Record<string, number> = { '\\qquad': 2, '\\quad': 1, '\\;': 5 / 18 };
const GAP = /^\s*(\\qquad|\\quad|\\;)/;

/**
 * 把一条独立公式在「顶层的逗号 + 间距」处切成几段（如 `v = k\sqrt{d},\qquad k = 11` → 两段，间距 2em）。
 * 每段单独渲染、段间用等宽的 margin 代替原来的间距：宽屏下与整条渲染的排版一致，
 * 窄屏放不下时在段与段之间换行，而不是在式子中间断开。花括号和 \left…\right 里面的逗号不切。
 */
export function splitDisplayTex(tex: string): Array<{ tex: string; gapEm: number }> {
  const parts: Array<{ tex: string; gapEm: number }> = [];
  let depth = 0;
  let start = 0;
  let gapBefore = 0;
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (tex.startsWith('\\left', i)) depth++;
    else if (tex.startsWith('\\right', i)) depth--;
    else if (c === ',' && depth === 0) {
      let rest = tex.slice(i + 1);
      let gap = 0;
      for (let m = GAP.exec(rest); m; m = GAP.exec(rest)) {
        gap += GAP_EM[m[1]];
        rest = rest.slice(m[0].length);
      }
      if (gap < 0.5) continue; // 逗号后只有一个 \; 之类的小间距：是式子内部的标点，不是分段
      parts.push({ tex: tex.slice(start, i + 1), gapEm: gapBefore });
      gapBefore = gap;
      start = tex.length - rest.length;
      i = start - 1;
    }
  }
  parts.push({ tex: tex.slice(start), gapEm: gapBefore });
  return parts;
}

function renderDisplay(tex: string): string {
  return splitDisplayTex(tex)
    .map((p) => `<span class="tex-seg" style="--gap:${+p.gapEm.toFixed(3)}">${renderTex(p.tex, true)}</span>`)
    .join('');
}

export function prerenderTex(html: string): string {
  let filled = 0;
  const out = html.replace(PLACEHOLDER, (_all, open: string, _tag: string, tex: string, close: string) => {
    filled++;
    return open + (/\bdata-display\b/.test(open) ? renderDisplay(tex) : renderTex(tex, false)) + close;
  });
  // 占位必须是空元素：写了内容或标签没闭合的 data-tex 不会被上面的正则填充，这里让它直接失败而不是悄悄漏掉
  const total = html.match(/\bdata-tex="/g)?.length ?? 0;
  if (filled !== total) throw new Error(`[katex] index.html 里有 ${total} 个 data-tex，只填充了 ${filled} 个：占位元素必须为空`);
  return out;
}

export function katexPrerender(): Plugin {
  return {
    name: 'hail-katex-prerender',
    enforce: 'pre',
    // KaTeX 的 CSS 每个字体都列了 woff2 / woff / ttf 三种来源：只留 woff2，dist 里就不会产出另外两种
    transform(code, id) {
      if (!/katex(\.min)?\.css/.test(id)) return null;
      return code.replace(/,url\([^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g, '');
    },
    transformIndexHtml: { order: 'pre', handler: (html) => prerenderTex(html) },
  };
}
