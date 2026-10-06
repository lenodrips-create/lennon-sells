import { useEffect, useRef } from 'react';

// One soft gold mote, drawn once and stamped for every particle (much cheaper
// than building a gradient per particle per frame).
function makeSprite() {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 236, 180, 1)');
  grad.addColorStop(0.35, 'rgba(210, 174, 98, 0.5)');
  grad.addColorStop(1, 'rgba(210, 174, 98, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// Canvas of gold motes rising like incense through candlelight.
export default function GoldDust({ density = 70 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 640;
    const count = Math.round(density * (small ? 0.5 : 1));
    const sprite = makeSprite();

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const motes = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      vy: 0.00025 + Math.random() * 0.0009,
      drift: Math.random() * Math.PI * 2,
      tw: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        if (!reduce) {
          m.y -= m.vy;
          m.drift += 0.01;
          if (m.y < -0.05) {
            m.y = 1.05;
            m.x = Math.random();
          }
        }
        const size = m.r * 8;
        ctx.globalAlpha = 0.35 + 0.45 * Math.sin(t * 0.002 + m.tw) ** 2;
        ctx.drawImage(sprite, (m.x + Math.sin(m.drift) * 0.01) * w - size / 2, m.y * h - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
