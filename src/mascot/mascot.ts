export type Expression = 'happy' | 'scared' | 'solemn' | 'safety' | 'lab';

export interface Mascot {
  el: HTMLDivElement;
  setExpression(e: Expression): void;
}

const TEMPLATE = `
<svg viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="44" fill="#eef8ff" stroke="#9fcbe8" stroke-width="5"/>
  <path d="M60 24 a36 36 0 0 1 36 36" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>
  <path d="M60 36 a24 24 0 0 1 24 24" fill="none" stroke="#cfe9fa" stroke-width="3" stroke-linecap="round"/>
  <g data-part="eyes-open">
    <circle cx="46" cy="54" r="5" fill="#222"/>
    <circle cx="74" cy="54" r="5" fill="#222"/>
  </g>
  <g data-part="eyes-closed" style="display:none">
    <path d="M40 54 h12 M68 54 h12" stroke="#222" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>
  <path data-part="mouth" d="M48 74 Q60 84 72 74" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>
  <g data-part="helmet" style="display:none">
    <path d="M28 46 a32 32 0 0 1 64 0 z" fill="#ffd84d" stroke="#d9a72e" stroke-width="3"/>
    <rect x="24" y="44" width="72" height="8" rx="4" fill="#d9a72e"/>
  </g>
  <g data-part="goggles" style="display:none">
    <rect x="36" y="44" width="20" height="16" rx="6" fill="#bfe3ff" stroke="#222" stroke-width="3"/>
    <rect x="64" y="44" width="20" height="16" rx="6" fill="#bfe3ff" stroke="#222" stroke-width="3"/>
    <path d="M56 52 h8" stroke="#222" stroke-width="3"/>
  </g>
</svg>`;

// 各表情的嘴形（SVG path d）
const MOUTHS: Record<Expression, string> = {
  happy: 'M48 74 Q60 84 72 74',
  scared: 'M54 76 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0',
  solemn: 'M50 78 h20',
  safety: 'M48 74 Q60 84 72 74',
  lab: 'M48 76 Q60 82 72 76',
};

export function createMascot(sizePx = 96, expression: Expression = 'happy'): Mascot {
  const el = document.createElement('div');
  el.className = 'mascot-wrap';
  el.style.width = `${sizePx}px`;
  el.style.height = `${sizePx}px`;
  el.innerHTML = TEMPLATE;

  const q = <T extends Element>(sel: string): T => el.querySelector<T>(sel)!;
  const mouth = q<SVGPathElement>('[data-part="mouth"]');
  const eyesOpen = q<SVGGElement>('[data-part="eyes-open"]');
  const eyesClosed = q<SVGGElement>('[data-part="eyes-closed"]');
  const helmet = q<SVGGElement>('[data-part="helmet"]');
  const goggles = q<SVGGElement>('[data-part="goggles"]');

  function setExpression(e: Expression): void {
    mouth.setAttribute('d', MOUTHS[e]);
    eyesOpen.style.display = e === 'solemn' ? 'none' : '';
    eyesClosed.style.display = e === 'solemn' ? '' : 'none';
    helmet.style.display = e === 'safety' ? '' : 'none';
    goggles.style.display = e === 'lab' ? '' : 'none';
  }

  setExpression(expression);
  return { el, setExpression };
}
