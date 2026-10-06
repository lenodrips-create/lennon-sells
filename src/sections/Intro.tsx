import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { IMG } from '../config';

type Phase = 'loading' | 'trevi' | 'cathedral' | 'reveal' | 'done';

// Where the camera flies to in each photo (as % of the image)
const ARCH = '34% 47%'; // the Trevi Fountain's central arch
const ALTAR = '50% 66%'; // the far end of the cathedral aisle

const TREVI_MS = 2400;
const CATHEDRAL_MS = 2300;
const REVEAL_MS = 900;

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

// Opening: fly into the Trevi Fountain's arch, come out inside a cathedral,
// fly down the aisle into the light, and the site opens.
export default function Intro({ onReveal }: { onReveal: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setPhase('done');
      onReveal();
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    // Start once both photos are ready (or after 2.5s regardless)
    Promise.race([
      Promise.all([preload(IMG.trevi), preload(IMG.cathedral)]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(() => {
      if (cancelled) return;
      setPhase('trevi');
      at(TREVI_MS, () => setPhase('cathedral'));
      at(TREVI_MS + CATHEDRAL_MS, () => {
        setPhase('reveal');
        onReveal();
      });
      at(TREVI_MS + CATHEDRAL_MS + REVEAL_MS, () => setPhase('done'));
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scrolling while the intro plays
  useEffect(() => {
    const lock = phase !== 'done' && phase !== 'reveal';
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [phase]);

  const skip = () => {
    if (phase === 'reveal' || phase === 'done') return;
    setPhase('reveal');
    onReveal();
    setTimeout(() => setPhase('done'), REVEAL_MS);
  };

  const flying = phase === 'trevi';
  const inCathedral = phase === 'cathedral' || phase === 'reveal';
  // Accelerating "camera push" curve
  const pushEase = [0.55, 0, 0.85, 0.35] as const;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[80] overflow-hidden bg-ink"
          animate={{ opacity: phase === 'reveal' ? 0 : 1 }}
          transition={{ duration: REVEAL_MS / 1000, ease: 'easeInOut' }}
          exit={{ opacity: 0 }}
        >
          {/* Trevi Fountain */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'loading' ? 0 : inCathedral ? 0 : 1 }}
            transition={{ duration: inCathedral ? 0.5 : 0.6 }}
          >
            {/* Blurred fill so wide screens show the whole facade without bars */}
            <motion.img
              src={IMG.trevi}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              style={{ filter: 'blur(28px) brightness(0.7)' }}
              initial={{ scale: 1.1 }}
              animate={{ scale: flying || inCathedral ? 2.5 : 1.1 }}
              transition={{ duration: TREVI_MS / 1000 + 0.3, ease: pushEase }}
            />
            {/* The whole facade, framed to the screen height; the camera pushes into the arch
                while drifting it to the centre of the screen */}
            <div className="absolute inset-0 flex justify-center">
              <motion.div
                className="relative h-full shrink-0"
                style={{ aspectRatio: '640 / 1136', transformOrigin: ARCH }}
                initial={{ scale: 1, x: '0%', y: '0%', filter: 'blur(0px) brightness(1)' }}
                animate={
                  flying || inCathedral
                    ? { scale: 6, x: '16%', y: '3%', filter: 'blur(3px) brightness(1.6)' }
                    : { scale: 1, x: '0%', y: '0%', filter: 'blur(0px) brightness(1)' }
                }
                transition={{ duration: TREVI_MS / 1000 + 0.3, ease: pushEase }}
              >
                <img src={IMG.trevi} alt="" className="h-full w-full object-cover" />
              </motion.div>
            </div>
            {/* Light pouring out of the arch as we approach */}
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,246,220,0.95), rgba(244,225,166,0.4) 25%, transparent 55%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: flying ? [0, 0, 1] : inCathedral ? 1 : 0 }}
              transition={{ duration: TREVI_MS / 1000, times: [0, 0.55, 1], ease: 'easeIn' }}
            />
          </motion.div>

          {/* Cathedral nave */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: inCathedral ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img
              src={IMG.cathedral}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: ALTAR, transformOrigin: ALTAR }}
              initial={{ scale: 1.35, filter: 'blur(4px) brightness(1.4)' }}
              animate={
                inCathedral
                  ? { scale: 3.4, filter: ['blur(4px) brightness(1.4)', 'blur(0px) brightness(1)', 'blur(2px) brightness(1.5)'] }
                  : { scale: 1.35 }
              }
              transition={{ duration: CATHEDRAL_MS / 1000 + 0.4, ease: [0.4, 0, 0.8, 0.5] }}
            />
            {/* The altar's light swells and swallows the frame */}
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at ${ALTAR}, rgba(255,246,220,1), rgba(244,225,166,0.55) 30%, rgba(210,174,98,0.15) 60%, transparent 80%)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: inCathedral ? [0, 0, 1] : 0 }}
              transition={{ duration: CATHEDRAL_MS / 1000, times: [0, 0.6, 1], ease: 'easeIn' }}
            />
          </motion.div>

          {/* Vignette for a cinematic frame */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(15,10,7,0.65) 100%)' }}
          />

          {/* Name over the fountain, fading as the camera moves */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[12%] text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase === 'loading' ? 0 : flying ? [1, 1, 0] : 0, y: 0 }}
            transition={{ duration: flying ? 1.6 : 0.6, times: flying ? [0, 0.5, 1] : undefined }}
          >
            <p
              className="font-display text-3xl font-extrabold tracking-[0.2em] text-marble sm:text-5xl"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
            >
              LENNON RESELLS
            </p>
          </motion.div>

          {phase === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="h-10 w-10 rounded-full border-2 border-gold/30 border-t-gold"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={skip}
            className="absolute font-display text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-marble/70 transition-colors hover:text-gold"
            style={{ right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
