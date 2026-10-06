import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import { seek } from '../config';

// Keeps "request an item" within reach once you've scrolled past the hero.
export default function FloatingSeek() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => {
    const form = document.getElementById('request');
    const inForm = form ? Math.abs(form.getBoundingClientRect().top) < window.innerHeight * 0.6 : false;
    setShow(v > window.innerHeight * 0.8 && !inForm);
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => seek()}
          className="fixed z-50 flex items-center gap-3 rounded-full border border-gold/60 bg-ink/80 py-3 pl-3 pr-5 font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-marble backdrop-blur-md"
          style={{
            right: 16,
            bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 0 30px rgba(158,43,31,0.55)',
          }}
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.8 }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <motion.span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-imperial text-gold"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            aria-hidden
          >
            ✦
          </motion.span>
          Want something else?
        </motion.button>
      )}
    </AnimatePresence>
  );
}
