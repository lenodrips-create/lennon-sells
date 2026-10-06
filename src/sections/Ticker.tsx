import { motion, useScroll, useTransform, useVelocity, useSpring } from 'framer-motion';

const WORDS = ['Chrome Hearts', 'Only 1 available', 'Sterling silver', 'Lennon Resells', 'Requests open', 'Ships fast', 'Pics on request', 'Drop 001'];

function Row({ reverse = false }: { reverse?: boolean }) {
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 80, damping: 30 });
  const skew = useTransform(velocity, [-2000, 2000], [8, -8]);
  const items = [...WORDS, ...WORDS];
  return (
    <motion.div className="flex w-max" style={{ skewX: skew }}>
      <motion.div
        className="flex shrink-0 items-center gap-8 pr-8"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((w, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span
              className={
                i % 2
                  ? 'gilded font-display text-3xl font-bold uppercase sm:text-5xl'
                  : 'font-display text-3xl uppercase tracking-[0.15em] text-marble/20 sm:text-5xl'
              }
            >
              {w}
            </span>
            <span className="text-xl text-imperial-bright">✦</span>
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function Ticker() {
  return (
    <section aria-label="Highlights" className="relative overflow-hidden border-y border-gold/20 bg-umber py-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <Row />
        <Row reverse />
      </div>
    </section>
  );
}
