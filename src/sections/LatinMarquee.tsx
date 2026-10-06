import { motion, useScroll, useTransform, useVelocity, useSpring } from 'framer-motion';

const WORDS = ['Amor', 'Chrome Hearts', 'Fides', 'Lennon Resells', 'Sanctus', 'Argentum .925', 'Gloria', 'Vitrum Sacrum'];

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
                  ? 'font-gothic text-4xl text-gold sm:text-6xl'
                  : 'font-roman text-3xl uppercase tracking-[0.2em] text-marble/25 sm:text-5xl'
              }
            >
              {w}
            </span>
            <span className="text-2xl text-rose-bright">✠</span>
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function LatinMarquee() {
  return (
    <section aria-label="Inscriptions" className="relative overflow-hidden border-y border-gold/20 bg-crypt py-6 sm:py-8">
      <div className="flex flex-col gap-4">
        <Row />
        <Row reverse />
      </div>
    </section>
  );
}
