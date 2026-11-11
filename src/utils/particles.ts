export type ParticleMode = 'off' | 'hail-light';

interface P {
  x: number;
  y: number;
  vy: number;
  r: number;
}

const MODES: Record<
  Exclude<ParticleMode, 'off'>,
  { count: number; rMin: number; rMax: number; vMin: number; vMax: number }
> = {
  'hail-light': { count: 45, rMin: 2, rMax: 5, vMin: 3, vMax: 6 },
};

export class ParticleField {
  private ps: P[] = [];
  private mode: ParticleMode = 'off';
  private raf = 0;
  private ctx: CanvasRenderingContext2D;

  constructor(
    private canvas: HTMLCanvasElement,
    private cap = 300,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.ps = [];
  }

  setMode(mode: ParticleMode): void {
    this.mode = mode;
    this.ps = [];
  }

  start(): void {
    if (!this.raf) this.tick();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const { width: w, height: h } = this.canvas;
    this.ctx.clearRect(0, 0, w, h);
    if (this.mode === 'off') return;

    const cfg = MODES[this.mode];
    const target = Math.min(cfg.count, this.cap);
    while (this.ps.length < target) {
      this.ps.push({
        x: Math.random() * w,
        y: Math.random() * -h,
        vy: cfg.vMin + Math.random() * (cfg.vMax - cfg.vMin),
        r: cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
      });
    }
    if (this.ps.length > target) this.ps.length = target;

    this.ctx.fillStyle = 'rgba(238,248,255,0.92)';
    for (const p of this.ps) {
      p.y += p.vy;
      if (p.y - p.r > h) {
        p.y = -p.r * 2;
        p.x = Math.random() * w;
      }
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  };
}
