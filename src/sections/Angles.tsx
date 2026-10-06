import { motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { IMG } from '../config';

const PANELS = [
  { title: 'Front', note: 'Black acetate', pos: '18% 55%', zoom: 1.9, tint: 'rgba(158,43,31,0.55)' },
  { title: 'Cross', note: 'Sterling hardware', pos: '62% 40%', zoom: 1.9, tint: 'rgba(143,179,209,0.35)' },
  { title: 'Full view', note: 'The whole thing', pos: '50% 50%', zoom: 1, tint: 'rgba(210,174,98,0.35)' },
  { title: 'Temple', note: 'Built to last', pos: '96% 35%', zoom: 2.2, tint: 'rgba(185,138,78,0.45)' },
];

function Panel({ p, i, progress }: { p: (typeof PANELS)[number]; i: number; progress: MotionValue<number> }) {
  const imgX = useTransform(progress, [0, 1], [`${10 - i * 4}%`, `${-10 + i * 4}%`]);
  return (
    <div className="relative h-[62vh] w-[78vw] shrink-0 sm:w-[46vw] lg:w-[34vw]">
      <div
        className="h-full rounded-t-full p-[2px]"
        style={{ background: 'linear-gradient(180deg, #F4E1A6, #9A7633 50%, rgba(154,118,51,0.1))' }}
      >
        <div
          className="relative h-full overflow-hidden rounded-t-full"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${p.tint}, #0F0A07 75%)` }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              x: imgX,
              backgroundImage: `url(${IMG.glasses})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: p.pos,
              backgroundSize: `${p.zoom * 100}% auto`,
              filter: 'drop-shadow(0 0 14px rgba(244,225,166,0.3))',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
          <div className="absolute inset-x-0 bottom-8 text-center">
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-gold/80">
              {['I', 'II', 'III', 'IV'][i]} · {p.note}
            </p>
            <p className="gilded mt-2 font-display text-4xl font-extrabold uppercase sm:text-5xl">{p.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pinned gallery: scrolling down walks you sideways through a row of arches.
export default function Angles() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 32));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.25]);

  return (
    <section id="angles" ref={ref} className="relative h-[300vh] bg-ink">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <motion.div className="px-4 pb-8 sm:px-8" style={{ opacity: titleOpacity }}>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.45em] text-gold">Gallery</p>
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none text-marble sm:text-6xl">
            Every <span className="gilded">angle</span>
          </h2>
        </motion.div>
        <motion.div ref={trackRef} className="flex w-max gap-6 pl-4 sm:gap-10 sm:pl-8" style={{ x }}>
          {PANELS.map((p, i) => (
            <Panel key={p.title} p={p} i={i} progress={scrollYProgress} />
          ))}
          <div className="flex w-[70vw] shrink-0 items-center sm:w-[40vw]">
            <p className="max-w-sm text-3xl italic leading-snug text-marble/70">
              Every cross, every curve, every bit of silver. One pair, and it could be yours.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
