import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { IMG } from '../config';

type Phase = 'loading' | 'trevi' | 'cathedral' | 'hold' | 'reveal' | 'done';

// Where the camera flies to in each photo (as % of the image)
const ARCH = '34% 47%'; // the Trevi Fountain's central arch
const ALTAR = '50% 66%'; // the far end of the cathedral aisle

const TREVI_MS = 2400;
const CATHEDRAL_MS = 2300;
const HOLD_MS = 450; // screen stays filled with light while the site loads underneath
const REVEAL_MS = 900;

// Accelerating "camera push" curve
const PUSH = [0.55, 0, 0.85, 0.35] as const;
const GPU = { willChange: 'transform', backfaceVisibility: 'hidden' } as const;

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => (img.decode ? img.decode().catch(() => undefined).then(() => resolve()) : resolve());
    img.onerror = () => resolve();
    img.src = src;
  });
}

// Opening: fly into the Trevi Fountain's arch, come out inside a cathedral,
// fly down the aisle into the light, and the site opens.
// Only transforms and opacity animate here, so it stays smooth on phones.
export default function Intro({ onReveal }: { onReveal: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      onReveal();
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    // Start once both photos are decoded (or after 2.5s regardless)
    Promise.race([
      Promise.all([preload(IMG.trevi), preload(IMG.cathedral), preload(IMG.treviBlur)]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(() => {
      if (cancelled) return;
      setPhase('trevi');
      at(TREVI_MS, () => setPhase('cathedral'));
      at(TREVI_MS + CATHEDRAL_MS, () => {
        setPhase('hold');
        onReveal();
      });
      at(TREVI_MS + CATHEDRAL_MS + HOLD_MS, () => setPhase('reveal'));
      at(TREVI_MS + CATHEDRAL_MS + HOLD_MS + REVEAL_MS, () => setPhase('done'));
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
    if (phase === 'hold' || phase === 'reveal' || phase === 'done') return;
    setPhase('hold');
    onReveal();
    setTimeout(() => setPhase('reveal'), HOLD_MS);
    setTimeout(() => setPhase('done'), HOLD_MS + REVEAL_MS);
  };

  const flying = phase === 'trevi';
  const pastTrevi = phase === 'cathedral' || phase === 'hold' || phase === 'reveal';
  const inCathedral = pastTrevi;
  const pushed = flying || pastTrevi;

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
            animate={{ opacity: phase === 'loading' || pastTrevi ? 0 : 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pre-blurred fill so wide screens have no bars (no live CSS blur) */}
            <motion.img
              src={IMG.treviBlur}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              style={GPU}
              initial={{ scale: 1.1 }}
              animate={{ scale: pushed ? 2.5 : 1.1 }}
              transition={{ duration: TREVI_MS / 1000 + 0.3, ease: PUSH }}
            />
            {/* The facade, framed to the screen height; the camera pushes into the arch
                while drifting it to the centre of the screen */}
            <div className="absolute inset-0 flex justify-center">
              <motion.img
                src={IMG.trevi}
                alt=""
                className="relative h-full max-w-none shrink-0 object-cover"
                style={{ ...GPU, aspectRatio: '640 / 1136', transformOrigin: ARCH }}
                initial={{ scale: 1, x: '0%', y: '0%' }}
                animate={pushed ? { scale: 6, x: '16%', y: '3%' } : { scale: 1, x: '0%', y: '0%' }}
                transition={{ duration: TREVI_MS / 1000 + 0.3, ease: PUSH }}
              />
            </div>
            {/* Light pouring out of the arch as we approach */}
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,246,220,0.95), rgba(244,225,166,0.4) 25%, transparent 55%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: flying ? [0, 0, 1] : pastTrevi ? 1 : 0 }}
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
              style={{ ...GPU, objectPosition: ALTAR, transformOrigin: ALTAR }}
              initial={{ scale: 1.35 }}
              animate={{ scale: inCathedral ? 3.4 : 1.35 }}
              transition={{ duration: CATHEDRAL_MS / 1000 + 0.4, ease: [0.4, 0, 0.8, 0.5] }}
            />
            {/* Arrival flash from the arch, fading as the nave comes into view */}
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[#FFF6DC]"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: inCathedral ? 0 : 0.7 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            {/* The altar's light swells and swallows the frame */}
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${ALTAR}, rgba(255,246,220,1), rgba(244,225,166,0.6) 30%, rgba(210,174,98,0.25) 60%, rgba(210,174,98,0.1) 85%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'cathedral' ? [0, 0, 1] : phase === 'hold' || phase === 'reveal' ? 1 : 0 }}
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
