// 共享内联 SVG 图标（规格 §3.3）：24×24，单色 currentColor，线端与转角一律圆头，不用渐变和滤镜。
// 图标默认是纯装饰（aria-hidden）；需要可读名称时由使用处在外层给 aria-label。

const ICONS = {
  // 民航客机（俯视，机头朝右）
  plane:
    '<path d="M3.5 12h16" stroke-width="3.2"/><path d="M9 12l4-7.5h2.2L13.6 12l1.6 7.5H13z" fill="currentColor" stroke-width="1"/><path d="M4 12L3 8.4h1.7L6.6 12z" fill="currentColor" stroke-width="1"/>',
  // 珠峰（带雪顶的山）
  everest:
    '<path d="M2.5 19.5L9 7l4 7 2.5-4 6 9.5z"/><path d="M9 7l2.3 4-2.3 1.4-2.1-1.5z" fill="currentColor" stroke-width="1"/>',
  // 0℃ 层（雪花）
  freezing:
    '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.6 4.6L12 6.6l2.4-2M9.6 19.4l2.4-2 2.4 2"/>',
  // 云底（平底的云）
  cloudBase:
    '<path d="M7 18.5h10.4a4 4 0 0 0 .7-7.94 5.6 5.6 0 0 0-10.7-1.5A4.75 4.75 0 0 0 7 18.5z" fill="currentColor"/>',
  // 地面（地平线上的小房子）
  ground: '<path d="M4.5 11.5L12 5l7.5 6.5"/><path d="M6.8 10.5v8h10.4v-8"/><path d="M2.5 19.5h19"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** 返回一段内联 SVG 字符串（用于 innerHTML） */
export function icon(name: IconName, sizePx = 18): string {
  return `<svg class="icon" viewBox="0 0 24 24" width="${sizePx}" height="${sizePx}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
