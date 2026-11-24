import { describe, expect, test } from 'vitest';
import html from '../index.html?raw';
import { resolveLocale, systemLocale } from '../src/i18n/locale';
import { en } from '../src/i18n/strings/en';
import { ja } from '../src/i18n/strings/ja';

const textKeys = [...html.matchAll(/\bdata-i18n="([^"]+)"/g)].map((m) => m[1]);
const attrKeys = [...html.matchAll(/\bdata-i18n-attr="([^"]+)"/g)].flatMap((m) =>
  m[1].split(';').map((pair) => pair.split(':')[1].trim()),
);
const pageKeys = new Set([...textKeys, ...attrKeys]);

/** 中文源文本里每个 data-i18n 元素带的 slot 名（data-slot="x"） */
function zhSlots(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const re = /<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;
  for (const m of html.matchAll(re)) {
    out.set(m[2], [...m[3].matchAll(/\bdata-slot="(\w+)"/g)].map((s) => s[1]).sort());
  }
  return out;
}

describe.each([
  ['ja', ja],
  ['en', en],
])('%s 译文', (_name, dict) => {
  test('页面上每个键都有译文', () => {
    expect([...pageKeys].filter((k) => !(k in dict))).toEqual([]);
  });

  test('没有页面上不存在的多余键', () => {
    expect(Object.keys(dict).filter((k) => !pageKeys.has(k))).toEqual([]);
  });

  test('译文里的 {slot} 与中文源文本的 data-slot 一一对应', () => {
    for (const [key, slots] of zhSlots()) {
      const used = [...(dict[key] ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect({ key, slots: used }).toEqual({ key, slots });
    }
  });

  test.runIf(_name === 'en')('英文译文里没有中日文字符与全角标点（复制中文源文本时最容易漏）', () => {
    for (const [key, v] of Object.entries(dict)) expect({ key, cjk: /[\u3000-\u9fff\uff00-\uffef]/.test(v) }).toEqual({ key, cjk: false });
  });
});

describe('带汉字的公式：三种语言的占位只差 \\text{…} 里的字', () => {
  // 同一处的三份占位是相邻的兄弟元素：按出现顺序三个一组
  const variants = [...html.matchAll(/\bdata-tex-lang="(zh|ja|en)"[^>]*?\bdata-tex="([^"]*)"/g)];
  test('每处正好 zh、ja、en 三份，按这个顺序', () => {
    expect(variants.length % 3).toBe(0);
    for (let i = 0; i < variants.length; i += 3) {
      expect(variants.slice(i, i + 3).map((m) => m[1])).toEqual(['zh', 'ja', 'en']);
    }
  });
  test('去掉 \\text{…} 之后三份完全相同', () => {
    const strip = (t: string): string => t.replace(/\\text\{[^}]*\}/g, '\\text{}');
    for (let i = 0; i < variants.length; i += 3) {
      const [zh, jaT, enT] = variants.slice(i, i + 3).map((m) => strip(m[2]));
      expect(jaT).toBe(zh);
      expect(enT).toBe(zh);
    }
  });
});

describe('语言解析', () => {
  test('跟随系统：中文系 → zh，日文 → ja，其余 → en', () => {
    expect(systemLocale(['zh-CN'])).toBe('zh');
    expect(systemLocale(['zh-TW', 'en'])).toBe('zh');
    expect(systemLocale(['ja-JP'])).toBe('ja');
    expect(systemLocale(['ja'])).toBe('ja');
    expect(systemLocale(['en-US'])).toBe('en');
    expect(systemLocale(['fr-FR', 'zh-CN'])).toBe('en'); // 只看首选语言
    expect(systemLocale(['ko'])).toBe('en');
    expect(systemLocale([])).toBe('en');
  });
  test('明确的偏好优先，无效值按跟随系统处理', () => {
    expect(resolveLocale('ja', ['zh-CN'])).toBe('ja');
    expect(resolveLocale('en', ['ja'])).toBe('en');
    expect(resolveLocale('auto', ['ja'])).toBe('ja');
    expect(resolveLocale(null, ['de'])).toBe('en');
    expect(resolveLocale('fr', ['zh-HK'])).toBe('zh');
  });
});
