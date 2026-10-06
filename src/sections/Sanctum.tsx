import { motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { GLASSES } from '../config';

const PANELS = [
  { latin: 'Facies', english: 'The face', pos: '20% 50%', zoom: 1.6, tint: 'rgba(142,27,46,0.55)' },
  { latin: 'Crux', english: 'The cross', pos: '62% 40%', zoom: 2.1, tint: 'rgba(29,42,94,0.6)' },
  { latin: 'Lux', english: 'The light', pos: '50% 50%', zoom: 1, tint: 'rgba(212,175,98,0.35)' },
  { latin: 'Amor', english: 'The devotion', pos: '90% 30%', zoom: 1.8, tint: 'rgba(142,27,46,0.5)' },
];

function Panel({ p, i, progress }: { p: (typeof PANELS)[number]; i: number; progress: MotionValue<number> }) {
  const imgX = useTransform(progress, [0, 1], [`${10 - i * 4}%`, `${-10 + i * 4}%`]);
  return (
    <div className="relative h-[62vh] w-[78vw] shrink-0 sm:w-[46vw] lg:w-[34vw]">
      <div
        className="h-full rounded-t-full p-[2px]"
        style={{ background: 'linear-gradient(180deg, #F6E3A8, #9C7A35 50%, rgba(156,122,53,0.1))' }}
      >
        <div
          className="relative h-full overflow-hidden rounded-t-full"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${p.tint}, #0B0709 75%)` }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              x: imgX,
              backgroundImage: `url(${GLASSES})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: p.pos,
              backgroundSize: `${p.zoom * 100}% auto`,
              filter: 'drop-shadow(0 0 14px rgba(246,227,168,0.35))',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-nave to-transparent" />
          <div className="absolute inset-x-0 bottom-8 text-center">
            <p className="font-roman text-[0.6rem] uppercase tracking-[0.5em] text-gold/70">
              {['I', 'II', 'III', 'IV'][i]} · {p.english}
            </p>
            <p className="gilded mt-2 font-gothic text-5xl sm:text-6xl">{p.latin}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pinned gallery: scrolling down walks you sideways through the chapel's arches.
export default function Sanctum() {
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
    <section id="sanctum" ref={ref} className="relative h-[300vh] bg-nave">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <motion.div className="px-4 pb-8 sm:px-8" style={{ opacity: titleOpacity }}>
          <p className="font-roman text-xs uppercase tracking-[0.5em] text-gold/80">The chapel</p>
          <h2 className="font-gothic text-5xl leading-none text-marble sm:text-7xl">
            Sanctum <span className="gilded">Sanctorum</span>
          </h2>
        </motion.div>
        <motion.div ref={trackRef} className="flex w-max gap-6 pl-4 sm:gap-10 sm:pl-8" style={{ x }}>
          {PANELS.map((p, i) => (
            <Panel key={p.latin} p={p} i={i} progress={scrollYProgress} />
          ))}
          <div className="flex w-[70vw] shrink-0 items-center sm:w-[40vw]">
            <p className="max-w-sm text-3xl italic leading-snug text-marble/70">
              Every angle, every cross, every gleam of silver. One pair. Yours, if you ask.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
