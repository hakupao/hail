import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { rulerMarks } from '../content';

export function initRuler(): void {
  const ruler = document.createElement('aside');
  ruler.id = 'ruler';
  ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = `
    <div class="ruler-track">
      ${rulerMarks
        .map(
          (m) =>
            `<div class="ruler-mark" data-km="${m.km}" style="top:${(1 - m.km / 10) * 100}%"><span>${m.label}</span></div>`,
        )
        .join('')}
      <div class="ruler-indicator"><b class="ruler-alt">10.0</b> km</div>
    </div>`;
  document.body.appendChild(ruler);

  const indicator = ruler.querySelector<HTMLElement>('.ruler-indicator')!;
  const altEl = ruler.querySelector<HTMLElement>('.ruler-alt')!;
  const marks = Array.from(ruler.querySelectorAll<HTMLElement>('.ruler-mark'));

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const alt = 10 * (1 - self.progress); // 滚动进度 0→1 映射高度 10km→0m
      indicator.style.top = `${(1 - alt / 10) * 100}%`;
      altEl.textContent = alt.toFixed(1);
      for (const m of marks) {
        m.classList.toggle('active', Math.abs(Number(m.dataset.km) - alt) < 0.6);
      }
    },
  });
}
