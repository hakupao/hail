export type ParticleMode = 'off' | 'hail-light';

interface P {
  x: number;
  y: number;
  /** 景深 0（远）– 1（近）：决定大小、速度、浓淡 */
  z: number;
  vy: number;
  r: number;
  /** 近处几颗的高光弧朝向与转速（弧度 / 帧） */
  a: number;
  spin: number;
}

const MODES: Record<
  Exclude<ParticleMode, 'off'>,
  { count: number; rMin: number; rMax: number; vMin: number; vMax: number }
> = {
  // 近大远小、近快远慢：r 与 vy 都按景深在两端之间取值
  'hail-light': { count: 45, rMin: 1.2, rMax: 6, vMin: 1.6, vMax: 7 },
};

/** 景深超过这个值的算「近处」：画高光弧并缓慢自转（约占总数的八分之一） */
const NEAR = 0.82;

export class ParticleField {
  private ps: P[] = [];
  private mode: ParticleMode = 'off';
  private raf = 0;
  private last = 0;
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
    this.last = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick = (now = 0): void => {
    this.raf = requestAnimationFrame(this.tick);
    const { width: w, height: h } = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    if (this.mode === 'off') return;

    // 速度按 60 帧标定；高刷屏和掉帧时按实际间隔折算（上限 3 帧，切回标签页时不会瞬移）
    const k = this.last && now ? Math.min(3, (now - this.last) / 16.7) : 1;
    this.last = now;

    const cfg = MODES[this.mode];
    const target = Math.min(cfg.count, this.cap);
    if (this.ps.length < target) {
      while (this.ps.length < target) {
        // 平方分布：远处的小颗多、近处的大颗少
        const z = Math.random() ** 2;
        this.ps.push({
          x: Math.random() * w,
          y: Math.random() * -h,
          z,
          vy: cfg.vMin + z * (cfg.vMax - cfg.vMin),
          r: cfg.rMin + z * (cfg.rMax - cfg.rMin),
          a: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.05,
        });
      }
      this.ps.sort((p, q) => p.z - q.z); // 远的先画，近的压在上面
    }
    if (this.ps.length > target) this.ps.length = target;

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#9fcbe8';
    for (const p of this.ps) {
      p.y += p.vy * k;
      if (p.y - p.r > h) {
        p.y = -p.r * 2;
        p.x = Math.random() * w;
      }
      ctx.fillStyle = `rgba(238,248,255,${(0.4 + 0.55 * p.z).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.z > NEAR) {
        // 和雹宝身上那道高光弧是同一个画法：四分之一圈的内弧，跟着自转
        p.a += p.spin * k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.62, p.a, p.a + Math.PI / 2);
        ctx.stroke();
      }
    }
  };
}
