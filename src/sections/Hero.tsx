import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { PointerEvent } from 'react';
import GoldDust from '../components/GoldDust';
import Petals from '../components/Petals';
import Laurel from '../components/Laurel';
import Magnet from '../components/Magnet';
import { IMG, seek } from '../config';

const TITLE = ['LENNON', 'RESELLS'];
const START = 0.35; // the hero mounts as the intro opens
const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 18 });
  const smy = useSpring(my, { stiffness: 50, damping: 18 });

  // Depth layers: painting far, statues mid, glasses near
  const bgX = useTransform(smx, (v) => v * -18);
  const bgY = useTransform(smy, (v) => v * -12);
  const leftX = useTransform(smx, (v) => v * 26);
  const rightX = useTransform(smx, (v) => v * 34);
  const glassX = useTransform(smx, (v) => v * 40);
  const glassY = useTransform(smy, (v) => v * 24);
  const rotY = useTransform(smx, (v) => v * 22);
  const rotX = useTransform(smy, (v) => v * -14);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const statueY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgScrollY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  let letter = 0;

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink"
    >
      {/* Painted heavens */}
      <motion.div aria-hidden className="absolute inset-[-6%]" style={{ x: bgX, y: bgScrollY }}>
        <motion.div className="h-full w-full" style={{ y: bgY }}>
          <img
            src={IMG.painting}
            alt=""
            className="kenburns h-full w-full object-cover object-[50%_25%] opacity-70"
            style={{ willChange: 'transform' }}
          />
        </motion.div>
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 42%, rgba(15,10,7,0.15), rgba(15,10,7,0.75) 70%), linear-gradient(180deg, rgba(15,10,7,0.7) 0%, rgba(15,10,7,0.2) 30%, rgba(15,10,7,0.5) 70%, #0F0A07 100%)',
        }}
      />

      {/* Sun rays through the clouds (pre-rendered, just rotated) */}
      <div aria-hidden className="absolute left-1/2 top-[38%] h-0 w-0">
        <img
          src={IMG.rays}
          alt=""
          className="spin-slow absolute left-[-80vmax] top-[-80vmax] h-[160vmax] w-[160vmax] max-w-none"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* Jupiter, left */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[-14%] z-[5] w-[46vw] max-w-[440px] sm:left-[-2%] sm:w-[30vw] lg:left-[3%]"
        style={{ x: leftX, y: statueY, opacity: fade, willChange: 'transform' }}
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: START - 0.2, duration: 1.8, ease: EASE }}
      >
        <img
          src={IMG.jupiter}
          alt=""
          className="w-full"
        />
      </motion.div>

      {/* Neptune, right */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-20%] z-[5] w-[58vw] max-w-[560px] sm:right-[-6%] sm:w-[38vw] lg:right-[0%]"
        style={{ x: rightX, y: statueY, opacity: fade, willChange: 'transform' }}
        initial={{ y: 220, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: START, duration: 1.8, ease: EASE }}
      >
        <img
          src={IMG.neptune}
          alt=""
          className="w-full"
        />
      </motion.div>

      <GoldDust density={80} />
      <Petals count={16} />

      <motion.div className="relative z-10 flex w-full flex-col items-center px-4 pt-20 text-center" style={{ y: contentY }}>
        <motion.p
          className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-gold sm:text-xs"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START, duration: 1 }}
        >
          Drop 001 · Chrome Hearts eyewear
        </motion.p>

        {/* The glasses, crowned in laurel */}
        <motion.div
          className="relative mb-12 mt-14 w-[min(80vw,520px)] sm:mb-16 sm:mt-20"
          style={{ x: glassX, y: glassY, rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: START + 0.2, duration: 1.6, ease: EASE }}
        >
          <div aria-hidden className="absolute inset-x-[22%] top-[46%] aspect-square -translate-y-1/2">
            <Laurel delay={START} className="h-full w-full opacity-90" />
          </div>
          <div
            aria-hidden
            className="absolute inset-[-25%]"
            style={{ background: 'radial-gradient(closest-side, rgba(244,225,166,0.32), rgba(210,174,98,0.1) 50%, transparent 100%)' }}
          />
          <Magnet padding={120} strength={5}>
            <motion.img
              src={IMG.glasses}
              alt="Chrome Hearts optical frames in black acetate with sterling silver cross hardware"
              className="relative w-full select-none"
              draggable={false}
              animate={{ y: [0, -14, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ willChange: 'transform' }}
            />
          </Magnet>
        </motion.div>

        <h1
          className="flex flex-wrap justify-center gap-x-[0.3em] font-display text-[13vw] font-extrabold leading-[0.95] tracking-tight sm:text-[8.5vw] lg:text-[7.25rem]"
          aria-label="Lennon Resells"
        >
          {TITLE.map((word) => (
            <span key={word} aria-hidden className="inline-flex">
              {word.split('').map((c) => {
                const i = letter++;
                return (
                  <motion.span
                    key={i}
                    className="gilded inline-block"
                    initial={{ opacity: 0, y: 70, rotateX: -90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: START + 0.6 + i * 0.06, duration: 1, ease: EASE }}
                    style={{ transformOrigin: 'bottom', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                  >
                    {c}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-4 max-w-md text-xl italic text-marble/90 sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START + 1.5, duration: 1 }}
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
        >
          One pair. Real sterling silver. When it&apos;s gone, it&apos;s gone.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START + 1.8, duration: 1 }}
        >
          <Magnet padding={60} strength={3}>
            <a href="#pair" className="holy-btn">
              See the pair
            </a>
          </Magnet>
          <Magnet padding={60} strength={3}>
            <button type="button" onClick={() => seek()} className="ghost-btn">
              Request something else
            </button>
          </Magnet>
        </motion.div>
      </motion.div>

      <motion.a
        href="#pair"
        aria-label="Scroll to the pair"
        className="absolute inset-x-0 bottom-4 z-10 mx-auto hidden w-max flex-col items-center gap-2 font-display text-[0.6rem] uppercase tracking-[0.4em] text-gold/80 [@media(min-height:960px)]:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: START + 2.4 }}
      >
        Scroll
        <motion.span
          className="block h-10 w-px bg-gradient-to-b from-gold to-transparent"
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.a>
    </section>
  );
}
