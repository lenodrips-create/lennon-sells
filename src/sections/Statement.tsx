import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import RevealText from '../components/RevealText';
import GoldDust from '../components/GoldDust';
import Laurel from '../components/Laurel';
import { IMG } from '../config';

// Neptune rises out of the dark while the line lights up word by word.
export default function Statement() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const statueY = useTransform(scrollYProgress, [0, 1], ['25%', '-10%']);
  const statueScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1.08]);
  const paintY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <section ref={ref} className="relative flex min-h-[120svh] items-center overflow-hidden px-4 py-32 sm:px-8">
      <motion.div aria-hidden className="absolute inset-[-12%]" style={{ y: paintY }}>
        <img src={IMG.painting} alt="" className="h-full w-full object-cover object-[50%_70%] opacity-25" />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, #0F0A07 20%, rgba(15,10,7,0.6) 60%, rgba(15,10,7,0.2)), linear-gradient(0deg, #0F0A07, transparent 30%, transparent 70%, #0F0A07)' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-25%] w-[95vw] max-w-[720px] opacity-50 sm:right-[-5%] sm:w-[55vw] sm:opacity-90"
        style={{ y: statueY, scale: statueScale }}
      >
        <img
          src={IMG.neptune}
          alt=""
          className="w-full"
        />
      </motion.div>
      <GoldDust density={45} />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <div className="relative mb-8 h-24 w-24" aria-hidden>
            <Laurel className="h-full w-full" />
          </div>
          <RevealText
            text="Statues last two thousand years. Good silver isn't far behind. Wear something that outlives the trend."
            className="font-display text-3xl font-bold uppercase leading-[1.15] text-marble sm:text-5xl"
          />
        </div>
      </div>
    </section>
  );
}
