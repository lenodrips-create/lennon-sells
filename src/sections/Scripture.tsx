import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import RevealText from '../components/RevealText';
import RoseWindow from '../components/RoseWindow';
import GoldDust from '../components/GoldDust';

export default function Scripture() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.05, 0.8]);

  return (
    <section ref={ref} className="relative flex min-h-[110svh] items-center justify-center overflow-hidden px-4 py-32 sm:px-8">
      <motion.div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ rotate, scale }}>
        <RoseWindow className="h-[130vw] w-[130vw] max-h-[900px] max-w-[900px] opacity-[0.18]" />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(142,27,46,0.3), transparent 60%)' }}
      />
      <GoldDust density={50} />
      <div className="relative max-w-4xl text-center">
        <motion.p
          className="font-gothic text-7xl text-rose-bright sm:text-9xl"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          ♥
        </motion.p>
        <RevealText
          text="Love is patient, love is kind. It does not envy, it does not boast. It always protects, always trusts, always hopes."
          className="mt-6 text-4xl font-light italic leading-tight text-marble sm:text-6xl"
        />
        <p className="mt-10 font-roman text-xs uppercase tracking-[0.5em] text-gold/80">1 Corinthians 13</p>
      </div>
    </section>
  );
}
