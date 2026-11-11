import katex from 'katex';
import type { Plugin } from 'vite';

// 公式构建时预渲染（v3 规格 §1.1）：把 index.html 里的空占位
//   <span class="tex" data-tex="…"></span>                    行内
//   <div class="tex-display" data-tex="…" data-display></div>  独立公式
// 填成 KaTeX 的静态 HTML + MathML。运行时不加载任何 KaTeX JS，无 JS 时公式照常显示。

// data-tex 的值可以用双引号或单引号包；占位元素必须是空的
const PLACEHOLDER = /(<(span|div)\b[^>]*?\bdata-tex\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>)\s*(<\/\2>)/g;

const ENTITY: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&amp;': '&' };
/** 属性值里的 HTML 实体还原成 TeX 原文（`a &amp;= b` → `a &= b`）。一次扫描，`&amp;lt;` 只还原一层 */
export function decodeEntities(value: string): string {
  return value.replace(/&(?:lt|gt|quot|#39|apos|amp);/g, (e) => ENTITY[e]);
}

/** TeX 写错会抛错（throwOnError），让 dev 报错、让构建失败 */
export function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { displayMode, output: 'htmlAndMathml', strict: false, throwOnError: true });
}

/** 独立公式里的间距命令折算成 em（\qquad = 2em、\quad = 1em、\; = 5/18em） */
const GAP_EM: Record<string, number> = { '\\qquad': 2, '\\quad': 1, '\\;': 5 / 18 };
const GAP = /^\s*(\\qquad|\\quad|\\;)/;

/** 作用到当前组结尾的开关：切开之后后半段就不在它的作用范围里了 */
const SWITCHES = new Set([
  'color', 'displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle',
  'tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize', 'large', 'Large', 'LARGE', 'huge', 'Huge',
  'rm', 'bf', 'it', 'sf', 'tt', 'cal', 'boldmath', 'unboldmath',
]);

/**
 * 把一条独立公式在「顶层的逗号 + 间距」处切成几段（如 `v = k\sqrt{d},\qquad k = 11` → 两段，间距 2em）。
 * 每段单独渲染、段间用等宽的 margin 代替原来的间距：宽屏下与整条渲染的排版一致，
 * 窄屏放不下时在段与段之间换行，而不是在式子中间断开。
 *
 * 规则：
 * 1. 只在「逗号 + 合计不小于 0.5em 的间距命令（\qquad / \quad / 连着几个 \;）」处切；逗号后只有一个 \; 的是式子内部的标点。
 * 2. 只切顶层的逗号。以下都算进了一层：花括号 `{…}`、普通括号 `(…)` `[…]`、`\left…\right`。
 *    `\left` / `\right` 连同后面的定界符（`(`、`.`、`\{`、`\langle` …）算一个整体，定界符本身不再计数；
 *    转义的 `\{` `\}` 等不计数。左右括号种类不必相同（半开区间 `[0, 1)` 也配得上）。
 *    括号不配对导致层数回不到 0 时，后面就不再切——宁可不切，不切错。
 * 3. 出现以下命令的整条不切：`\begin`（aligned、cases 等环境，切开就不是完整的环境了），
 *    以及 SWITCHES 里那些作用到组尾的开关（`\color`、`\displaystyle`、字号 / 字体开关）。
 */
export function splitDisplayTex(tex: string): Array<{ tex: string; gapEm: number }> {
  const parts: Array<{ tex: string; gapEm: number }> = [];
  let depth = 0;
  let start = 0;
  let gapBefore = 0;
  for (let i = 0; i < tex.length; i++) {
    const c = tex[i];
    if (c === '\\') {
      // 控制序列：\ 加一串字母，或 \ 加单个非字母字符（\{ \, \; \\ …）
      const name = /^[a-zA-Z]+/.exec(tex.slice(i + 1))?.[0] ?? tex.slice(i + 1, i + 2);
      i += name.length;
      if (name === 'begin' || SWITCHES.has(name)) return [{ tex, gapEm: 0 }];
      if (name === 'left' || name === 'right') {
        depth += name === 'left' ? 1 : -1;
        // 吃掉后面的定界符：单个字符，或一个控制序列
        const delim = /^\s*(\\[a-zA-Z]+|\\[^a-zA-Z]|[^\\\s])/.exec(tex.slice(i + 1));
        if (delim) i += delim[0].length;
      }
    } else if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      let rest = tex.slice(i + 1);
      let gap = 0;
      for (let m = GAP.exec(rest); m; m = GAP.exec(rest)) {
        gap += GAP_EM[m[1]];
        rest = rest.slice(m[0].length);
      }
      if (gap < 0.5) continue; // 规则 1
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
  const filledAt = new Set<number>();
  const out = html.replace(PLACEHOLDER, (all: string, open: string, _tag: string, dq: string | undefined, sq: string | undefined, close: string, offset: number) => {
    filledAt.add(offset + all.search(/\bdata-tex\s*=/));
    const tex = decodeEntities(dq ?? sq ?? '');
    return open + (/\bdata-display\b/.test(open) ? renderDisplay(tex) : renderTex(tex, false)) + close;
  });
  // 源文件里出现的每一处 data-tex 都必须被上面的正则填充。漏掉的（占位里写了内容、标签没闭合、值没加引号、
  // 前面的属性值里有 >、用在 span / div 以外的元素上…）直接让构建失败并指出行号，而不是悄悄留一个空占位。
  // 按字面找、不解析 HTML：注释或正文里提到 data-tex 也会报——宁可误报，不漏报
  const missed: number[] = [];
  for (const m of html.matchAll(/\bdata-tex(?![\w-])/g)) {
    if (!filledAt.has(m.index)) missed.push(html.slice(0, m.index).split('\n').length);
  }
  if (missed.length > 0) {
    throw new Error(`[katex] index.html 第 ${missed.join('、')} 行的 data-tex 没有被转换：占位必须是空的 <span> 或 <div>，值用引号包住`);
  }
  return out;
}

export function katexPrerender(): Plugin {
  return {
    name: 'hail-katex-prerender',
    enforce: 'pre',
    // KaTeX 的 CSS 每个字体都列了 woff2 / woff / ttf 三种来源：只留 woff2，dist 里就不会产出另外两种
    transform(code, id) {
      if (!/katex(\.min)?\.css/.test(id)) return null;
      return (
        code
          .replace(/,url\([^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g, '')
          // KaTeX 默认 font-display:block，慢网下公式最多空白 3 秒：改成 swap，先用后备字体显示
          .replace(/font-display:block/g, 'font-display:swap')
      );
    },
    transformIndexHtml: { order: 'pre', handler: (html) => prerenderTex(html) },
  };
}
