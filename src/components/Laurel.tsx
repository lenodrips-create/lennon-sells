import { motion } from 'framer-motion';

const LEAVES = 12;
const R = 150;
const FROM = 102; // degrees; 90 = bottom, 180 = left, 270 = top (SVG y points down)
const TO = 252;
const LEAF = 'M0 0 C 9 -11, 28 -13, 42 0 C 28 13, 9 11, 0 0 Z';

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (d: number) => [R * Math.cos(rad(d)), R * Math.sin(rad(d))] as const;

// Gilded laurel wreath: two branches grow up from a red ribbon and meet near the top.
export default function Laurel({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const [sx, sy] = pt(FROM);
  const [ex, ey] = pt(TO);
  const stem = `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;

  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden overflow="visible">
      <defs>
        <linearGradient id="leaf-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4E1A6" />
          <stop offset="55%" stopColor="#D2AE62" />
          <stop offset="100%" stopColor="#7A5E24" />
        </linearGradient>
      </defs>
      {[1, -1].map((side) => (
        <g key={side} transform={`scale(${side} 1)`}>
          <motion.path
            d={stem}
            fill="none"
            stroke="#B8954C"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 1.6, ease: 'easeInOut' }}
          />
          {Array.from({ length: LEAVES }, (_, i) => {
            const t = i / (LEAVES - 1);
            const d = FROM + t * (TO - FROM);
            const [x, y] = pt(d);
            const along = d + 90; // direction of growth along the branch
            const size = 1 - t * 0.35;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${along})`}>
                {[-1, 1].map((dir) => (
                  <motion.path
                    key={dir}
                    d={LEAF}
                    fill="url(#leaf-gold)"
                    stroke="#6E5420"
                    strokeWidth="0.8"
                    transform={`rotate(${dir * 32}) scale(${size})`}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: size }}
                    viewport={{ once: true }}
                    transition={{ delay: delay + 0.2 + i * 0.09 + (dir === 1 ? 0.05 : 0), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </g>
            );
          })}
        </g>
      ))}
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 1.2, duration: 0.8 }}
      >
        <path d="M-6 150 L-34 194 L-21 190 L-15 204 L4 156 Z" fill="#9E2B1F" />
        <path d="M6 150 L34 194 L21 190 L15 204 L-4 156 Z" fill="#7E2018" />
        <ellipse cx="0" cy="150" rx="12" ry="8" fill="#C9402C" stroke="#F4E1A6" strokeWidth="1" />
      </motion.g>
    </svg>
  );
}
