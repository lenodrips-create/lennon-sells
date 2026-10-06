import { motion } from 'framer-motion';
import FadeIn from '../components/FadeIn';
import Ornament from '../components/Ornament';
import Petals from '../components/Petals';

const ITEMS = ['Rings', 'Pendants', 'Hats', 'Hoodies', 'Leather', 'Eyewear'];

export default function Request() {
  return (
    <section
      id="request"
      className="relative overflow-hidden px-4 py-28 sm:px-8 sm:py-36"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(158,43,31,0.3), transparent 70%), linear-gradient(180deg, #0F0A07, #1B130D)',
      }}
    >
      <Petals count={10} />
      <FadeIn className="relative mx-auto max-w-3xl text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.45em] text-gold">Requests</p>
        <h2 className="mt-4 font-display text-4xl font-extrabold leading-none text-marble sm:text-6xl">
          Want something <span className="gilded">else?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-xl italic text-marble/75 sm:text-2xl">
          Rings, pendants, hats, hoodies, anything. Tell me what you&apos;re after and I&apos;ll track it down.
        </p>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {ITEMS.map((item, i) => (
            <motion.li
              key={item}
              className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-gold/80"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
            >
              {item}
            </motion.li>
          ))}
        </ul>
        <Ornament className="mt-12" />
      </FadeIn>
    </section>
  );
}
