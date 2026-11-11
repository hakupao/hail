import { describe, expect, test } from 'vitest';
import html from '../index.html?raw';
import { GROWTH_EFF, K, MELT_RATE } from '../src/lab/model';
import { prerenderTex, splitDisplayTex } from '../tools/katex-prerender';

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

  test('下落用时按 d_max 的落速算，暖层厚度是 1000·H₀ 米', () => {
    const landing = formulas.find((f) => f.includes('\\text{落地}'));
    expect(landing).toBeDefined();
    expect(landing).toContain('\\frac{1000\\,H_0}{k\\sqrt{d_{\\max}}}');
    expect(landing).toContain('\\max\\!\\left(0,');
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

  test('独立公式只在顶层的「逗号 + 大间距」处分段，括号里的逗号不切', () => {
    expect(splitDisplayTex('v = k\\sqrt{d},\\qquad k = 11')).toEqual([
      { tex: 'v = k\\sqrt{d},', gapEm: 0 },
      { tex: ' k = 11', gapEm: 2 },
    ]);
    expect(splitDisplayTex('\\max\\!\\left(0,\; d\\right),\\qquad r = 1').map((p) => p.tex)).toEqual([
      '\\max\\!\\left(0,\; d\\right),',
      ' r = 1',
    ]);
    expect(splitDisplayTex('a_{1,\\qquad 2}')).toHaveLength(1);
    // \\leftarrow / \\rightarrow 不是定界符，不能把后面的顶层逗号算进括号里
    expect(splitDisplayTex('a \\leftarrow b,\\qquad c \\rightarrow d,\\qquad e')).toHaveLength(3);
    // 分段不丢内容：除了被 margin 取代的间距命令，拼回去等于原式
    const strip = (t: string): string => t.replace(/\\qquad|\\quad|\\;|\s/g, '');
    for (const tex of allTex) {
      expect(strip(splitDisplayTex(tex).map((p) => p.tex).join(''))).toBe(strip(tex));
    }
  });
});
