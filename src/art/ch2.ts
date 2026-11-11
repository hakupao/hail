// 第二章专用内联 SVG：四个尺寸参照物的小图标（规格 §3.3：单色线稿、圆头线端，24×24）。
// 纯装饰，使用处的文字标签负责可读名称。

const REF_ICONS = {
  // 黄豆：略斜的椭圆 + 一道种脐
  bean: '<ellipse cx="12" cy="12" rx="8" ry="6.4" transform="rotate(-18 12 12)"/><path d="M9.4 10.6c1.7-1 3.5-1.2 5.2-.6"/>',
  // 乒乓球：光球 + 一道接缝弧
  pingpong: '<circle cx="12" cy="12" r="8.5"/><path d="M4.4 14.6c5.2 1.4 10.6-.4 14.6-5"/>',
  // 高尔夫球：球面上的凹坑
  golf:
    '<circle cx="12" cy="12" r="8.5"/><g fill="currentColor" stroke="none"><circle cx="12" cy="8" r="1.1"/><circle cx="8.6" cy="10.6" r="1.1"/><circle cx="15.4" cy="10.6" r="1.1"/><circle cx="12" cy="12.6" r="1.1"/><circle cx="9.4" cy="15.4" r="1.1"/><circle cx="14.6" cy="15.4" r="1.1"/></g>',
  // 垒球：两道弧形缝线
  softball:
    '<circle cx="12" cy="12" r="8.5"/><path d="M7.2 5c2.7 4.2 2.7 9.8 0 14M16.8 5c-2.7 4.2-2.7 9.8 0 14"/><path d="M9.6 8.6l1.6-.5M10.2 12h1.7M9.6 15.4l1.6.5M14.4 8.6l-1.6-.5M13.8 12h-1.7M14.4 15.4l-1.6.5" stroke-width="1.4"/>',
} as const;

export type RefIconName = keyof typeof REF_ICONS;

export function isRefIcon(name: string | undefined): name is RefIconName {
  return name !== undefined && name in REF_ICONS;
}

/** 返回一段内联 SVG 字符串（用于 innerHTML） */
export function refIcon(name: RefIconName): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${REF_ICONS[name]}</svg>`;
}
