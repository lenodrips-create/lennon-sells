import { motion } from 'framer-motion';
import Ornament from '../components/Ornament';
import { seek } from '../config';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/20 bg-crypt px-4 pb-10 pt-24 text-center sm:px-8">
      <Ornament />
      <motion.h2
        className="gilded mt-10 font-gothic text-[18vw] leading-none sm:text-[12vw] lg:text-[10rem]"
        initial={{ opacity: 0, y: 60, filter: 'blur(12px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        Lennon Resells
      </motion.h2>
      <p className="mt-6 text-xl italic text-marble/70">The relic waits. So does whatever else you seek.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a href="#relic" className="holy-btn">
          The relic
        </a>
        <button type="button" onClick={() => seek()} className="ghost-btn">
          Ask for another item
        </button>
      </div>
      <p className="mt-20 font-roman text-[0.6rem] uppercase tracking-[0.5em] text-marble/40">
        Ad maiorem amoris gloriam · MMXXVI
      </p>
      <p className="mt-3 text-sm text-marble/35">
        Independent reseller. Not affiliated with Chrome Hearts.
      </p>
    </footer>
  );
}
