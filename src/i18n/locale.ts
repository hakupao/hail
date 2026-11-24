// 三语：中文（页面源文本，也是无 JS 时的兜底）、日文、英文。
// 偏好存在 localStorage：'auto' 跟随系统语言——中文系 → zh、日文 → ja、其余一律 en。地址里的 ?lang= 优先于偏好（只在 head 脚本里处理）。
// index.html 的 <head> 内联脚本里有一份同样逻辑的副本（它必须在任何模块加载前跑完），改这里要同步改那里。

export type Locale = 'zh' | 'ja' | 'en';
export type LangPref = Locale | 'auto';

export const LOCALES: readonly Locale[] = ['zh', 'ja', 'en'];
export const PREF_KEY = 'hail-lang';

/** <html lang> 的取值 */
export const HTML_LANG: Record<Locale, string> = { zh: 'zh-CN', ja: 'ja', en: 'en' };

export function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'ja' || v === 'en';
}

/** 系统语言 → 页面语言：只看首选语言，zh* → zh，ja* → ja，其余（含空）→ en */
export function systemLocale(languages: readonly string[]): Locale {
  const first = (languages[0] ?? '').toLowerCase();
  if (first.startsWith('zh')) return 'zh';
  if (first.startsWith('ja')) return 'ja';
  return 'en';
}

export function resolveLocale(pref: string | null | undefined, languages: readonly string[]): Locale {
  return isLocale(pref) ? pref : systemLocale(languages);
}

export function readPref(): LangPref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return isLocale(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** 当前页面语言：以 <html lang> 为准（head 脚本已经按偏好写好）；node 环境（单测）下是 zh */
export function currentLocale(): Locale {
  if (typeof document === 'undefined') return 'zh';
  const lang = document.documentElement.lang.toLowerCase();
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('en')) return 'en';
  return 'zh';
}

export type Tri<T = string> = Record<Locale, T>;

/** 三语取一：TS 里的少量文案用它 */
export function tr<T>(t: Tri<T>): T {
  return t[currentLocale()];
}
