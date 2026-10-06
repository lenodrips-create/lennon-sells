import { motion } from 'framer-motion';
import Ornament from '../components/Ornament';
import { seek } from '../config';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/20 bg-umber px-4 pb-10 pt-24 text-center sm:px-8">
      <Ornament />
      <motion.h2
        className="gilded mt-10 font-display text-[12vw] font-extrabold leading-none sm:text-[9vw] lg:text-[8rem]"
        initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        LENNON RESELLS
      </motion.h2>
      <p className="mt-6 text-xl italic text-marble/70">The pair&apos;s here. Anything else, just ask.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a href="#pair" className="holy-btn">
          See the pair
        </a>
        <button type="button" onClick={() => seek()} className="ghost-btn">
          Request an item
        </button>
      </div>
      <p className="mt-20 font-display text-[0.6rem] font-semibold uppercase tracking-[0.45em] text-marble/40">
        Lennon Resells · MMXXVI
      </p>
      <p className="mt-3 text-sm text-marble/35">Independent reseller. Not affiliated with Chrome Hearts.</p>
    </footer>
  );
}
