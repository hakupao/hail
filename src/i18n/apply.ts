import type { Locale } from './locale';

export type Dict = Record<string, string>;

// 页面文案的标记约定（中文写在 index.html 里，是源文本；日文 / 英文在 strings/*.ts）：
//   data-i18n="key"                 元素内容换成译文。译文里可以带 <b> <br> <small> 等标签
//   data-slot="name"（后代元素）     译文里写 {name}，原节点（预渲染好的公式、带 id 的 tspan…）原样搬过去
//   data-i18n-attr="attr:key;…"     换属性（aria-label、SVG 的 width / x …）
//   data-tex-lang="zh|ja|en"        带汉字的公式每种语言各一份占位，只留当前语言那一份
// 翻译必须在各章 init 之前完成：GSAP 在 init 时量尺寸、建 pin。

const SLOT = /\{(\w+)\}/g;

export function applyLocale(root: ParentNode, locale: Locale, dict: Dict): string[] {
  const missing: string[] = [];

  for (const el of root.querySelectorAll<HTMLElement>('[data-tex-lang]')) {
    if (el.dataset.texLang === locale) el.removeAttribute('data-tex-lang');
    else el.remove();
  }
  if (locale === 'zh') return missing;

  for (const el of root.querySelectorAll<Element>('[data-i18n]')) {
    const key = el.getAttribute('data-i18n')!;
    const val = dict[key];
    if (val === undefined) {
      missing.push(key);
      continue;
    }
    if (!/[<{&]/.test(val)) {
      el.textContent = val;
      continue;
    }
    const slots = new Map<string, Element>();
    for (const s of el.querySelectorAll('[data-slot]')) slots.set(s.getAttribute('data-slot')!, s);
    el.innerHTML = val.replace(SLOT, (_, name: string) => `<i data-slot-ph="${name}"></i>`);
    for (const ph of el.querySelectorAll('[data-slot-ph]')) {
      const node = slots.get(ph.getAttribute('data-slot-ph')!);
      if (node) ph.replaceWith(node);
      else ph.remove();
    }
  }

  for (const el of root.querySelectorAll<Element>('[data-i18n-attr]')) {
    for (const pair of el.getAttribute('data-i18n-attr')!.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const val = dict[key];
      if (val === undefined) missing.push(key);
      else el.setAttribute(attr, val);
    }
  }
  return missing;
}
