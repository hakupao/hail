import { describe, expect, test } from 'vitest';
import html from '../index.html?raw';
import { GROWTH_EFF, K, MELT_RATE } from '../src/lab/model';
import { decodeEntities, prerenderTex, splitDisplayTex } from '../tools/katex-prerender';

// v3 规格 §1.3：第四章「模型的三条式子」里的常数必须等于 model.ts 导出的常数。
// 以后改了模型常数而忘了改页面，这里会红。
const allTex = [...html.matchAll(/\bdata-tex="([^"]*)"/g)].map((m) => m[1]);

function ch4Formulas(): string[] {
  const block = /<figure class="math-block ch4-math">[\s\S]*?<\/figure>/.exec(html);
  if (!block) throw new Error('index.html 里找不到第四章的公式块（.math-block.ch4-math）');
  return [...block[0].matchAll(/\bdata-tex="([^"]*)"[^>]*\bdata-display\b/g)].map((m) => m[1]);
}

/** 从三条式子里取出 `name = 数值`；找不到就抛错，不能静默通过 */
function constantIn(formulas: string[], name: string): number {
  const re = new RegExp(`(?:^|[\\s,])${name.replace(/\\/g, '\\\\')}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`);
  for (const f of formulas) {
    const m = re.exec(f);
    if (m) return Number(m[1]);
  }
  throw new Error(`第四章的三条式子里找不到「${name} = 数值」`);
}

describe('页面上的公式与模型一致', () => {
  const formulas = ch4Formulas();

  test('第四章正好有三条独立公式', () => {
    expect(formulas).toHaveLength(3);
  });

  test('k 等于 model.ts 的 K', () => {
    expect(constantIn(formulas, 'k')).toBe(K);
  });

  test('η 等于 model.ts 的 GROWTH_EFF', () => {
    expect(constantIn(formulas, '\\eta')).toBe(GROWTH_EFF);
  });

  test('r 等于 model.ts 的 MELT_RATE', () => {
    expect(constantIn(formulas, 'r')).toBe(MELT_RATE);
  });

  test('d_max 那条式子的结构是 η·(W/k)²', () => {
    const dmax = formulas.find((f) => f.startsWith('d_{\\max} ='));
    expect(dmax).toBeDefined();
    expect(dmax).toContain('d_{\\max} = \\eta\\left(\\frac{W}{k}\\right)^{2}');
  });

  test('下落用时按 d_max 的落速算，暖层厚度是 1000·H₀ 米', () => {
    const landing = formulas.find((f) => f.includes('\\text{落地}'));
    expect(landing).toBeDefined();
    expect(landing).toContain('\\frac{1000\\,H_0}{k\\sqrt{d_{\\max}}}');
    expect(landing).toContain('\\max\\!\\left(0,');
  });
});

// 第三章「动能怎么算」的两行代入：算出来的焦耳数必须等于动能条上的 data-joules，代入的数自己也要算得出这个结果
describe('第三章的代入数值与动能条一致', () => {
  const joulesOf = (cls: string): number => {
    const m = new RegExp(`<div class="energy-row ${cls}"[^>]*\\bdata-joules="([0-9.]+)"`).exec(html);
    if (!m) throw new Error(`index.html 里找不到动能条 .${cls} 的 data-joules`);
    return Number(m[1]);
  };

  test.each([
    [5, 'energy-hail5'],
    [8, 'energy-hail8'],
  ])('d = %i cm 那一行', (d, cls) => {
    const line = allTex.find((t) => t.startsWith(`d=${d}\\,\\text{cm}`));
    expect(line).toBeDefined();
    const m = /\\tfrac\{1\}\{2\}\\times ([0-9.]+)\\times ([0-9.]+)\^\{2\}\\approx ([0-9.]+)\\,\\text\{J\}/.exec(line!);
    if (!m) throw new Error(`第三章 d=${d} 那一行不是「½ × m × v² ≈ E J」的写法`);
    const [mass, v, shown] = m.slice(1).map(Number);
    expect(shown).toBe(joulesOf(cls));
    // 页面上的 m、v 是取整后的数，按它们算出来与标出的结果相差在 5% 以内
    expect(Math.abs(0.5 * mass * v ** 2 - shown) / shown).toBeLessThan(0.05);
    // 式子前半句写的质量就是代入的质量
    expect(line).toContain(`m\\approx ${mass}\\,\\text{kg}`);
  });
});

describe('公式预渲染', () => {
  test('index.html 里每一条 TeX 都能渲染，占位全部被填充', () => {
    expect(allTex.length).toBeGreaterThan(0);
    const out = prerenderTex(html);
    expect(out.match(/class="katex"/g)!.length).toBeGreaterThanOrEqual(allTex.length);
    expect(out).not.toMatch(/data-tex="[^"]*"[^>]*><\/(span|div)>/);
  });

  test('TeX 写错时抛错（让构建失败）', () => {
    expect(() => prerenderTex('<span class="tex" data-tex="\\frac{1}{"></span>')).toThrow();
  });

  test('占位元素不为空时抛错，而不是悄悄漏掉', () => {
    expect(() => prerenderTex('<span class="tex" data-tex="x">x</span>')).toThrow();
  });

  test('属性值里的 HTML 实体先还原再交给 KaTeX', () => {
    expect(decodeEntities('a &amp;= b &lt; c &gt; d &quot;e&quot; &#39;f&#39;')).toBe('a &= b < c > d "e" \'f\'');
    expect(decodeEntities('&amp;lt;')).toBe('&lt;'); // 只还原一层
    const out = prerenderTex('<span class="tex" data-tex="a &lt; b"></span>');
    expect(out).toContain('<mo>&lt;</mo>'); // 渲染出来是小于号
    expect(out).not.toContain('<mi>l</mi>'); // 而不是把 l、t 当成变量
    // aligned 里的 & 是对齐符：不还原的话 KaTeX 会把「amp;」当文字排出来
    const aligned = prerenderTex('<div class="tex-display" data-tex="\\begin{aligned}a &amp;= b\\end{aligned}" data-display></div>');
    expect(aligned).not.toContain('<mi>m</mi>');
  });

  test('单引号包住的 data-tex 一样被填充', () => {
    const out = prerenderTex("<span class='tex' data-tex='x^{2}'></span>");
    expect(out).toContain('class="katex"');
    expect(out).toContain("data-tex='x^{2}'"); // 占位标签原样保留
    expect(prerenderTex(`<span class="tex" data-tex='\\text{"a"}'></span>`)).toContain('class="katex"');
    expect(prerenderTex('<span class="tex" data-tex="a > b"></span>')).toContain('<mo>&gt;</mo>'); // 值里直接写 > 也行
  });

  test('没被转换的 data-tex 让构建失败并指出行号', () => {
    expect(() => prerenderTex('<p>\n<span class="tex" data-tex=x></span></p>')).toThrow(/第 2 行/); // 值没加引号
    expect(() => prerenderTex('<p class="tex" data-tex="x"></p>')).toThrow(/第 1 行/); // 不是 span / div
    expect(() => prerenderTex('<span title="a>b" data-tex="x"></span>')).toThrow(); // 前面的属性值里有 >
    expect(() => prerenderTex('<span data-tex="x"></span>\n\n<span data-tex="y"> </span><span data-tex="z">z</span>')).toThrow(/第 3 行/);
  });

  test('独立公式只在顶层的「逗号 + 大间距」处分段', () => {
    const texOf = (t: string): string[] => splitDisplayTex(t).map((p) => p.tex);
    expect(splitDisplayTex('v = k\\sqrt{d},\\qquad k = 11')).toEqual([
      { tex: 'v = k\\sqrt{d},', gapEm: 0 },
      { tex: ' k = 11', gapEm: 2 },
    ]);
    // 逗号后只有一个 \; ：式子内部的标点，在顶层也不切
    expect(texOf('a,\\; b,\\qquad c')).toEqual(['a,\\; b,', ' c']);
    // 连着两个 \; 够 0.5em：切（第三章的代入行靠它在窄屏换行）
    expect(splitDisplayTex('a,\\;\\; b')).toEqual([
      { tex: 'a,', gapEm: 0 },
      { tex: ' b', gapEm: 10 / 18 },
    ]);
  });

  test('括号里面的逗号不切：花括号、普通括号、\\left…\\right', () => {
    const texOf = (t: string): string[] => splitDisplayTex(t).map((p) => p.tex);
    expect(splitDisplayTex('a_{1,\\qquad 2}')).toHaveLength(1);
    expect(texOf('P = (x,\\qquad y),\\qquad Q = 1')).toEqual(['P = (x,\\qquad y),', ' Q = 1']);
    expect(texOf('I = [0,\\qquad 1),\\qquad J = 2')).toEqual(['I = [0,\\qquad 1),', ' J = 2']);
    // \left 后面跟的定界符不是 ( [ { ：只有认得 \left / \right 本身才不会切开
    expect(texOf('\\left|a,\\qquad b\\right|,\\qquad c')).toEqual(['\\left|a,\\qquad b\\right|,', ' c']);
    expect(texOf('\\max\\!\\left(0,\\qquad d\\right),\\qquad r = 1')).toEqual(['\\max\\!\\left(0,\\qquad d\\right),', ' r = 1']);
    // \left\{ … \right. ：定界符算在 \left / \right 里，不多计一层，后面的顶层逗号照切
    expect(texOf('\\left\\{a,\\qquad b\\right.,\\qquad c')).toEqual(['\\left\\{a,\\qquad b\\right.,', ' c']);
    // 定界符两边种类不同（一边是 . ）也配得上
    expect(texOf('\\left.a,\\qquad b\\right),\\qquad c')).toEqual(['\\left.a,\\qquad b\\right),', ' c']);
    expect(texOf('\\left(a,\\qquad b\\right.,\\qquad c')).toEqual(['\\left(a,\\qquad b\\right.,', ' c']);
    // 转义的 \{ \} 不计层数
    expect(texOf('\\{a\\},\\qquad b')).toEqual(['\\{a\\},', ' b']);
    expect(texOf('\\{ a,\\qquad b')).toEqual(['\\{ a,', ' b']);
    // \leftarrow / \rightarrow 不是定界符，不能把后面的顶层逗号算进括号里
    expect(splitDisplayTex('a \\leftarrow b,\\qquad c \\rightarrow d,\\qquad e')).toHaveLength(3);
  });

  test('带环境或作用到组尾的开关的式子整条不切', () => {
    for (const tex of [
      '\\begin{aligned}a &= b,\\qquad c\\end{aligned}',
      'x = \\begin{cases}1\\end{cases},\\qquad y',
      '\\color{red} a,\\qquad b',
      '\\displaystyle a,\\qquad b',
      '\\small a,\\qquad b',
    ]) {
      expect(splitDisplayTex(tex)).toEqual([{ tex, gapEm: 0 }]);
    }
    // 名字只是以它们开头的命令不受影响
    expect(splitDisplayTex('\\textcolor{red}{a},\\qquad \\smallsetminus')).toHaveLength(2);
  });

  test('页面上每条公式分段后不丢内容', () => {
    // 除了被 margin 取代的间距命令，拼回去等于原式
    const strip = (t: string): string => t.replace(/\\qquad|\\quad|\\;|\s/g, '');
    for (const tex of allTex) {
      expect(strip(splitDisplayTex(tex).map((p) => p.tex).join(''))).toBe(strip(tex));
    }
  });

  test('页面上 8 条独立公式的分段数', () => {
    const display = [...html.matchAll(/\bdata-tex="([^"]*)"[^>]*\bdata-display\b/g)].map((m) => m[1]);
    expect(display.map((t) => splitDisplayTex(t).length)).toEqual([1, 1, 2, 2, 2, 2, 2, 2]);
  });
});
