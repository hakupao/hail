import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { labPresets, outcomeMeta } from '../content';
import { simulate } from '../lab/model';
import type { Outcome } from '../lab/model';
import { createMascot } from '../mascot/mascot';
import { particleCap, reducedMotion } from '../utils/motion';
import { ParticleField } from '../utils/particles';
import type { ParticleMode } from '../utils/particles';

const OUTCOME_MODE: Record<Outcome, ParticleMode> = {
  rain: 'rain',
  'small-hail': 'small-hail',
  hail: 'hail',
  'giant-hail': 'giant-hail',
};

export function initCh4(section: HTMLElement): void {
  const wInput = section.querySelector<HTMLInputElement>('#lab-w')!;
  const hInput = section.querySelector<HTMLInputElement>('#lab-h0')!;
  const wOut = section.querySelector<HTMLOutputElement>('#lab-w-out')!;
  const hOut = section.querySelector<HTMLOutputElement>('#lab-h0-out')!;
  const emoji = section.querySelector<HTMLElement>('#lab-outcome-emoji')!;
  const label = section.querySelector<HTMLElement>('#lab-outcome-label')!;
  const dmaxEl = section.querySelector<HTMLElement>('#lab-dmax')!;
  const dfinalEl = section.querySelector<HTMLElement>('#lab-dfinal')!;
  const vlandEl = section.querySelector<HTMLElement>('#lab-vland')!;
  const cloudShade = section.querySelector<HTMLElement>('.lab-cloud-shade')!;
  const canvas = section.querySelector<HTMLCanvasElement>('#lab-canvas')!;

  // 实验室助手雹宝（护目镜代表实验室装扮，见 mascot.ts 设计决定）
  const mascot = createMascot(96, 'lab');
  section.querySelector('.lab-mascot-slot')!.appendChild(mascot.el);

  const field = new ParticleField(canvas, particleCap);

  // 仅当实验室在视口内时运行粒子
  if (!reducedMotion) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => field.start(),
      onEnterBack: () => field.start(),
      onLeave: () => field.stop(),
      onLeaveBack: () => field.stop(),
    });
  }

  function update(): void {
    const w = Number(wInput.value);
    const h0 = Number(hInput.value);
    wOut.textContent = `${w} m/s`;
    hOut.textContent = `${h0.toFixed(1)} km`;

    const r = simulate(w, h0);
    const meta = outcomeMeta[r.outcome];
    emoji.textContent = meta.emoji;
    label.textContent = meta.label;
    label.style.color = meta.tone;
    dmaxEl.textContent = `${r.maxDiameterCm.toFixed(1)} cm`;
    dfinalEl.textContent = r.outcome === 'rain' ? '—（全化了）' : `${r.finalDiameterCm.toFixed(1)} cm`;
    vlandEl.textContent = r.outcome === 'rain' ? '—' : `${r.landingSpeedMs.toFixed(0)} m/s`;

    // 云越"凶"越暗：上升气流 5→50 映射阴影透明度 0.1→0.75
    cloudShade.style.opacity = String(0.1 + ((w - 5) / 45) * 0.65);

    if (!reducedMotion) field.setMode(OUTCOME_MODE[r.outcome]);
  }

  wInput.addEventListener('input', update);
  hInput.addEventListener('input', update);

  // 预设按钮：单一数据源 content.ts → labPresets
  const presetBox = section.querySelector<HTMLElement>('.lab-presets')!;
  for (const p of labPresets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.name;
    btn.addEventListener('click', () => {
      wInput.value = String(p.w);
      hInput.value = String(p.h0);
      update();
    });
    presetBox.appendChild(btn);
  }

  update(); // 初始状态（25 m/s, 4.0 km）→ final≈3.0 cm → 🧊 危险冰雹
}
