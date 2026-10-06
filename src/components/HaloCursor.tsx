import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

// A small gold halo that trails the pointer and swells over links/buttons.
export default function HaloCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 });
  const sy = useSpring(y, { stiffness: 500, damping: 40 });
  const rx = useSpring(x, { stiffness: 120, damping: 20 });
  const ry = useSpring(y, { stiffness: 120, damping: 20 });
  const [hovering, setHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHovering(!!t?.closest('a, button, input, textarea, select, [data-halo]'));
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[70] h-2 w-2 rounded-full bg-gold"
        style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[70] rounded-full border border-gold/70"
        style={{
          x: rx,
          y: ry,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: '0 0 18px rgba(212,175,98,0.45), inset 0 0 10px rgba(212,175,98,0.25)',
        }}
        animate={{ width: hovering ? 64 : 34, height: hovering ? 64 : 34, opacity: hovering ? 1 : 0.7 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      />
    </>
  );
}
