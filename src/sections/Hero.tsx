import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { PointerEvent } from 'react';
import GoldDust from '../components/GoldDust';
import Petals from '../components/Petals';
import RoseWindow from '../components/RoseWindow';
import Magnet from '../components/Magnet';
import { GLASSES, seek } from '../config';

const TITLE = 'Lennon Resells';
const START = 3.0; // after the intro doors open

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });

  // Parallax layers at different depths
  const winX = useTransform(smx, (v) => v * -20);
  const winY = useTransform(smy, (v) => v * -20);
  const glassX = useTransform(smx, (v) => v * 30);
  const glassY = useTransform(smy, (v) => v * 20);
  const rotY = useTransform(smx, (v) => v * 18);
  const rotX = useTransform(smy, (v) => v * -12);

  // Scrolling away lifts the relic and fades the scene
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const liftY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const zoom = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(142,27,46,0.45), transparent 70%), radial-gradient(ellipse at 50% 120%, rgba(29,42,94,0.5), transparent 60%), #0B0709',
      }}
    >
      {/* God rays */}
      <div aria-hidden className="absolute left-1/2 top-[42%] h-0 w-0">
      <div
        className="spin-slow absolute left-[-110vmax] top-[-110vmax] h-[220vmax] w-[220vmax] opacity-40"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, rgba(246,227,168,0.16) 0deg 4deg, transparent 4deg 18deg)',
          maskImage: 'radial-gradient(circle, black 0%, transparent 45%)',
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 45%)',
        }}
      />
      </div>

      {/* Rose window */}
      <div aria-hidden className="absolute left-1/2 top-[42%] flex h-0 w-0 items-center justify-center">
      <motion.div
        className="shrink-0"
        style={{ x: winX, y: winY, scale: zoom, opacity: fade }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: START - 0.4, duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <RoseWindow className="spin-slow block h-[115vw] max-h-[820px] w-[115vw] max-w-[820px] opacity-60 sm:h-[90vw] sm:w-[90vw]" />
      </motion.div>
      </div>

      <GoldDust density={90} />
      <Petals count={22} />

      <motion.div className="relative z-10 flex w-full flex-col items-center px-4 pt-24 text-center" style={{ y: liftY }}>
        <motion.p
          className="font-roman text-[0.65rem] uppercase tracking-[0.55em] text-gold/80 sm:text-xs"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START, duration: 1 }}
        >
          ✠ Anno Domini MMXXVI ✠
        </motion.p>

        {/* The relic, crowned with a halo */}
        <motion.div
          className="relative mb-4 mt-14 w-[min(84vw,540px)] sm:mb-6 sm:mt-20"
          style={{ x: glassX, y: glassY, rotateX: rotX, rotateY: rotY, transformPerspective: 900 }}
          initial={{ opacity: 0, scale: 0.7, filter: 'blur(14px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: START + 0.2, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            aria-hidden
            className="flicker absolute inset-x-0 top-[-24%] mx-auto h-[20%] w-[55%] rounded-[50%] border-[3px] border-gold"
            style={{
              boxShadow:
                '0 0 25px rgba(246,227,168,0.9), 0 0 70px rgba(212,175,98,0.6), inset 0 0 18px rgba(246,227,168,0.7)',
            }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            aria-hidden
            className="absolute inset-[-15%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(246,227,168,0.35), rgba(212,175,98,0.12) 40%, transparent 70%)' }}
          />
          <Magnet padding={120} strength={5}>
            <motion.img
              src={GLASSES}
              alt="Chrome Hearts optical frames in black acetate with silver cross hardware"
              className="relative w-full select-none"
              draggable={false}
              animate={{ y: [0, -14, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                filter:
                  'drop-shadow(0 0 24px rgba(246,227,168,0.4)) drop-shadow(0 40px 40px rgba(0,0,0,0.7))',
              }}
            />
          </Magnet>
        </motion.div>

        <h1 className="font-gothic text-[15vw] leading-[0.95] sm:text-[11vw] lg:text-[9.5rem]" aria-label={TITLE}>
          {TITLE.split('').map((c, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="gilded inline-block"
              initial={{ opacity: 0, y: 60, rotateX: -90, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
              transition={{ delay: START + 0.6 + i * 0.06, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'bottom' }}
            >
              {c === ' ' ? ' ' : c}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mt-4 max-w-md text-xl italic text-marble/85 sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START + 1.5, duration: 1 }}
        >
          One relic, blessed in sterling silver. Chrome Hearts, found and kept for you.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: START + 1.8, duration: 1 }}
        >
          <Magnet padding={60} strength={3}>
            <a href="#relic" className="holy-btn">
              Behold the relic
            </a>
          </Magnet>
          <Magnet padding={60} strength={3}>
            <button type="button" onClick={() => seek()} className="ghost-btn">
              Seek another piece
            </button>
          </Magnet>
        </motion.div>
      </motion.div>

      <motion.a
        href="#relic"
        aria-label="Scroll to the relic"
        className="absolute inset-x-0 bottom-4 z-10 mx-auto hidden w-max flex-col [@media(min-height:960px)]:flex items-center gap-2 font-roman text-[0.6rem] uppercase tracking-[0.4em] text-gold/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: START + 2.4 }}
      >
        Descend
        <motion.span
          className="block h-10 w-px bg-gradient-to-b from-gold to-transparent"
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.a>
    </section>
  );
}
