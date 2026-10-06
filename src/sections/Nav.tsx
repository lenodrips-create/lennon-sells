import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

const LINKS = [
  { href: '#relic', label: 'The Relic' },
  { href: '#seek', label: 'Seek' },
  { href: '#sanctum', label: 'Sanctum' },
];

export default function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setSolid(v > 40));

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: solid ? 'rgba(11,7,9,0.72)' : 'transparent',
        backdropFilter: solid ? 'blur(12px)' : 'none',
        borderBottom: solid ? '1px solid rgba(212,175,98,0.18)' : '1px solid transparent',
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 3.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <a href="#top" className="gilded font-gothic text-2xl sm:text-3xl" aria-label="Lennon Resells, back to top">
          LR
        </a>
        <ul className="flex items-center gap-4 sm:gap-10">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative font-roman text-[0.62rem] uppercase tracking-[0.25em] text-marble/80 transition-colors hover:text-gold sm:text-xs"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  );
}
