import { useEffect, useRef } from 'react';

// Canvas of gold motes rising like incense through candlelight.
export default function GoldDust({ density = 70 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const motes = Array.from({ length: density }, () => ({
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
        const px = (m.x + Math.sin(m.drift) * 0.01) * w;
        const py = m.y * h;
        const a = 0.35 + 0.45 * Math.sin(t * 0.002 + m.tw) ** 2;
        const g = ctx.createRadialGradient(px, py, 0, px, py, m.r * 4);
        g.addColorStop(0, `rgba(255, 236, 180, ${a})`);
        g.addColorStop(0.4, `rgba(212, 175, 98, ${a * 0.5})`);
        g.addColorStop(1, 'rgba(212, 175, 98, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
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
