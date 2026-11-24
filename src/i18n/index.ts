import { applyLocale, type Dict } from './apply';
import { currentLocale, HTML_LANG, PREF_KEY, readPref, resolveLocale, tr, type LangPref, type Locale } from './locale';
import { en } from './strings/en';
import { ja } from './strings/ja';
import '../styles/i18n.css';

const DICTS: Record<Locale, Dict> = { zh: {}, ja, en };

/** 换文案 + 放出被 head 脚本藏起来的 #app。必须在各章 init 之前调用 */
export function initI18n(): void {
  const locale = currentLocale();
  document.documentElement.lang = HTML_LANG[locale];
  const missing = applyLocale(document, locale, DICTS[locale]);
  if (missing.length > 0 && import.meta.env.DEV) console.warn(`[i18n] ${locale} 缺少译文：`, missing);
  document.documentElement.classList.remove('i18n-pending');
  mountSwitcher(locale);
}

const OPTIONS: Array<{ value: LangPref; label: string }> = [
  { value: 'auto', label: tr({ zh: '跟随系统', ja: 'システムに合わせる', en: 'System' }) },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
];

const GLOBE =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';

/** 语言选择：放在 Hero 左上角，随页面滚走（不常驻，免得压住正文）。改了偏好就刷新——各章的测量与 pin 都按新文案重建 */
function mountSwitcher(locale: Locale): void {
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!hero) return;
  const pref = readPref();
  const box = document.createElement('label');
  box.className = 'lang-switch';
  box.innerHTML = `${GLOBE}<select aria-label="${tr({ zh: '语言', ja: '言語', en: 'Language' })}">${OPTIONS.map(
    (o) => `<option value="${o.value}"${o.value === pref ? ' selected' : ''}>${o.label}</option>`,
  ).join('')}</select>`;
  const select = box.querySelector('select')!;
  select.addEventListener('change', () => {
    const next = select.value as LangPref;
    try {
      if (next === 'auto') localStorage.removeItem(PREF_KEY);
      else localStorage.setItem(PREF_KEY, next);
    } catch {
      /* 隐私模式存不了：只影响记忆，不影响这次切换 */
    }
    // 地址里的 ?lang= 优先级最高（分享链接用）：手动选了语言就把它去掉，否则刷新后还是原来的语言
    const url = new URL(location.href);
    const hadParam = url.searchParams.has('lang');
    url.searchParams.delete('lang');
    const target = resolveLocale(next === 'auto' ? null : next, navigator.languages ?? [navigator.language]);
    if (target === locale && !hadParam) return;
    if (hadParam) location.replace(url.href);
    else location.reload();
  });
  hero.appendChild(box);
}
