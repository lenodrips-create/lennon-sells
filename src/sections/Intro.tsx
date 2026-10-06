import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Opening rite: a gold cross draws itself, then the cathedral doors part.
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

  const door = 'absolute top-0 h-full w-1/2 bg-crypt';
  const ease = [0.76, 0, 0.24, 1] as const;

  return (
    <AnimatePresence>
      {!gone && (
        <motion.div className="fixed inset-0 z-[80]" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <motion.div
            className={`${door} left-0 border-r border-gold/40`}
            animate={{ x: open ? '-100%' : 0 }}
            transition={{ duration: 1.3, ease }}
            style={{ backgroundImage: 'radial-gradient(ellipse at 100% 50%, rgba(142,27,46,0.35), transparent 60%)' }}
          >
            <DoorPanels />
          </motion.div>
          <motion.div
            className={`${door} right-0 border-l border-gold/40`}
            animate={{ x: open ? '100%' : 0 }}
            transition={{ duration: 1.3, ease }}
            style={{ backgroundImage: 'radial-gradient(ellipse at 0% 50%, rgba(142,27,46,0.35), transparent 60%)' }}
          >
            <DoorPanels />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            animate={{ opacity: open ? 0 : 1, scale: open ? 1.15 : 1 }}
            transition={{ duration: 0.6 }}
          >
            <svg viewBox="0 0 60 90" className="h-24 w-16 sm:h-32 sm:w-20" aria-hidden>
              <motion.path
                d="M30 4 V86 M8 28 H52"
                fill="none"
                stroke="#D4AF62"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 10px rgba(246,227,168,0.8))' }}
              />
            </svg>
            <motion.p
              className="gilded font-gothic text-4xl sm:text-6xl"
              initial={{ opacity: 0, letterSpacing: '0.4em' }}
              animate={{ opacity: 1, letterSpacing: '0.02em' }}
              transition={{ delay: 0.7, duration: 1.3, ease: 'easeOut' }}
            >
              Lennon Resells
            </motion.p>
            <motion.p
              className="font-roman text-[0.65rem] uppercase tracking-[0.5em] text-gold/70 sm:text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
            >
              In nomine amoris
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DoorPanels() {
  return (
    <div className="flex h-full flex-col justify-center gap-6 px-[12%] py-[10%]" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex-1 rounded-t-full border border-gold/25"
          style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }}
        />
      ))}
    </div>
  );
}
