import { useMemo } from 'react';

// Rose petals drifting down through a section.
export default function Petals({ count = 18 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => {
          const v = Math.sin(i * 9301 + n * 49297) * 233280;
          return v - Math.floor(v);
        };
        return {
          left: `${r(1) * 100}%`,
          size: 8 + r(2) * 14,
          duration: 11 + r(3) * 14,
          delay: -r(4) * 25,
          blur: r(5) > 0.75 ? 2 : 0,
        };
      }),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: p.blur ? `blur(${p.blur}px)` : undefined,
          }}
        />
      ))}
    </div>
  );
}
