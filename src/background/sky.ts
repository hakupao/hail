import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 色彩弧线（与 tokens.css 中的 --c-sky-* 一致）
const STOPS = [
  { p: 0.0, c: '#1a2b4a' },
  { p: 0.3, c: '#2d4a73' },
  { p: 0.65, c: '#7da7cf' },
  { p: 1.0, c: '#e9f4fb' },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

export function skyColorAt(p: number): string {
  const clamped = Math.min(1, Math.max(0, p));
  for (let i = 1; i < STOPS.length; i++) {
    if (clamped <= STOPS[i].p) {
      const t = (clamped - STOPS[i - 1].p) / (STOPS[i].p - STOPS[i - 1].p);
      return lerpColor(STOPS[i - 1].c, STOPS[i].c, t);
    }
  }
  return STOPS[STOPS.length - 1].c;
}

export function initSky(): void {
  const el = document.createElement('div');
  el.id = 'sky';
  document.body.prepend(el);
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const top = skyColorAt(self.progress);
      const bottom = skyColorAt(self.progress + 0.08);
      el.style.background = `linear-gradient(180deg, ${top}, ${bottom})`;
    },
  });
}
