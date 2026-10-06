import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Laurel from '../components/Laurel';

// Opening: a laurel wreath grows, then two marble columns slide apart.
export default function Intro() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = setTimeout(() => setOpen(true), reduce ? 0 : 2300);
    const t2 = setTimeout(() => setGone(true), reduce ? 0 : 3700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const ease = [0.76, 0, 0.24, 1] as const;

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div className="fixed inset-0 z-[80]" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          {(['left', 'right'] as const).map((side) => (
            <motion.div
              key={side}
              className={`absolute top-0 h-full w-1/2 bg-umber ${side === 'left' ? 'left-0 border-r' : 'right-0 border-l'} border-gold/30`}
              animate={{ x: open ? (side === 'left' ? '-100%' : '100%') : 0 }}
              transition={{ duration: 1.3, ease }}
            >
              <div
                className={`fluted absolute top-0 h-full w-[16%] max-w-[180px] ${side === 'left' ? 'left-[6%]' : 'right-[6%]'}`}
                style={{ boxShadow: '0 0 60px rgba(0,0,0,0.7)' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at ${side === 'left' ? '100%' : '0%'} 50%, rgba(158,43,31,0.35), transparent 60%)`,
                }}
              />
            </motion.div>
          ))}

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            animate={{ opacity: open ? 0 : 1, scale: open ? 1.15 : 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
              <Laurel className="absolute inset-0 h-full w-full" />
              <motion.span
                className="gilded font-display text-5xl font-bold sm:text-6xl"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                LR
              </motion.span>
            </div>
            <motion.p
              className="font-display text-sm font-semibold uppercase tracking-[0.5em] text-marble sm:text-base"
              initial={{ opacity: 0, letterSpacing: '1em' }}
              animate={{ opacity: 1, letterSpacing: '0.5em' }}
              transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
            >
              Lennon Resells
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
