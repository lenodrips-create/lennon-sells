import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { PointerEvent } from 'react';
import FadeIn from '../components/FadeIn';
import Ornament from '../components/Ornament';
import GoldDust from '../components/GoldDust';
import { IMG, seek } from '../config';

const DETAILS = [
  { n: 'I', title: 'Black acetate frame', text: 'Deep black, high-polish finish. Clean from every angle.' },
  { n: 'II', title: 'Sterling silver crosses', text: 'Signature Chrome Hearts cross hardware on both temples.' },
  { n: 'III', title: 'CH logo demo lenses', text: 'Swap in your prescription or wear them as they are.' },
  { n: 'IV', title: 'Full pics on request', text: 'Want every detail before you buy? Just ask.' },
];

// Glasses on a marble plinth inside a columned niche; tilts toward the cursor.
function Niche() {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 15 });
  const sry = useSpring(ry, { stiffness: 150, damping: 15 });
  const shineX = useTransform(sry, [-15, 15], ['0%', '100%']);
  const shine = useTransform(shineX, (v) => `radial-gradient(circle at ${v} 30%, rgba(244,225,166,0.3), transparent 50%)`);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 30);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -24);
  };

  return (
    <motion.div
      data-halo
      onPointerMove={onMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className="relative mx-auto w-full max-w-[540px]"
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-stretch">
        <div className="fluted w-[9%] shrink-0 rounded-t-sm" aria-hidden />
        <div
          className="relative flex aspect-[4/5] flex-1 items-center justify-center overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(244,225,166,0.28), transparent 55%), linear-gradient(180deg, #3A2414, #160F0A 75%)',
          }}
        >
          {/* Curtain lifting off */}
          <motion.div
            aria-hidden
            className="absolute inset-0 z-30 origin-top"
            style={{ background: 'linear-gradient(180deg, #9E2B1F, #4A120C)' }}
            initial={{ scaleY: 1 }}
            whileInView={{ scaleY: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.3, duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
          />
          <GoldDust density={35} />
          <motion.img
            src={IMG.glasses}
            alt="Chrome Hearts glasses, front three-quarter view"
            className="relative z-10 mb-[18%] w-[90%]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 22px rgba(244,225,166,0.3)) drop-shadow(0 30px 24px rgba(0,0,0,0.8))' }}
          />
          {/* Marble plinth */}
          <div className="absolute inset-x-[12%] bottom-0 z-10 h-[16%]" aria-hidden>
            <div className="fluted h-[22%] w-full rounded-t" />
            <div className="h-[78%] w-full" style={{ background: 'linear-gradient(180deg, #E4DCCD, #A99C86)' }} />
          </div>
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ background: shine }} />
        </div>
        <div className="fluted w-[9%] shrink-0 rounded-t-sm" aria-hidden />
      </div>
      <div className="h-3 w-full" style={{ background: 'linear-gradient(180deg, #E4DCCD, #8F826D)' }} aria-hidden />
    </motion.div>
  );
}

export default function Pair() {
  return (
    <section id="pair" className="relative overflow-hidden px-4 py-24 sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 25% 50%, rgba(158,43,31,0.22), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center sm:mb-20">
          <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.45em] text-gold">The only pair</p>
          <h2 className="gilded font-display text-5xl font-extrabold leading-none sm:text-7xl">Built for a god</h2>
          <Ornament className="mt-8" />
        </FadeIn>

        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Niche />

          <div className="min-w-0">
            <FadeIn y={20}>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-imperial-bright">Chrome Hearts</p>
              <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-marble sm:text-5xl" style={{ textWrap: 'balance' }}>
                Optical frames, black &amp; sterling
              </h3>
              <p className="mt-5 max-w-lg text-xl italic leading-relaxed text-marble/75">
                The kind of pair people ask about. There&apos;s exactly one, and it&apos;s here.
              </p>
            </FadeIn>

            <ol className="mt-10 flex flex-col">
              {DETAILS.map((c, i) => (
                <FadeIn key={c.n} as="li" delay={i * 0.12} x={40} y={0}>
                  <div className="group flex items-baseline gap-5 border-t border-gold/20 py-5 transition-colors duration-500 hover:border-gold/60">
                    <span className="w-10 shrink-0 font-display text-2xl text-gold transition-transform duration-500 group-hover:scale-125">
                      {c.n}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-marble">{c.title}</p>
                      <p className="mt-1 text-lg text-marble/65">{c.text}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </ol>

            <FadeIn delay={0.3} className="mt-10 flex flex-wrap items-center gap-6">
              <div>
                <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gold/80">Price</p>
                <p className="font-body text-3xl italic text-marble">DM for price</p>
              </div>
              <button type="button" className="holy-btn" onClick={() => seek('The Chrome Hearts glasses')}>
                I want this pair
              </button>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
