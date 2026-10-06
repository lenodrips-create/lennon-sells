import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { PointerEvent } from 'react';
import FadeIn from '../components/FadeIn';
import Ornament from '../components/Ornament';
import GoldDust from '../components/GoldDust';
import { GLASSES, seek } from '../config';

const COMMANDMENTS = [
  { n: 'I', title: 'Black acetate', text: 'A deep black front, polished to a candlelit shine.' },
  { n: 'II', title: 'Sterling cross hardware', text: 'Chrome Hearts silver crosses set into each temple.' },
  { n: 'III', title: 'Etched demo lenses', text: 'The CH cross marked on the lens, ready for your prescription.' },
  { n: 'IV', title: 'Proof before purchase', text: 'Ask, and receive every photo and detail you need.' },
];

function TiltFrame() {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 15 });
  const sry = useSpring(ry, { stiffness: 150, damping: 15 });
  const shineX = useTransform(sry, [-15, 15], ['0%', '100%']);
  const shine = useTransform(shineX, (v) => `radial-gradient(circle at ${v} 30%, rgba(246,227,168,0.35), transparent 50%)`);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 30);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -24);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      data-halo
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="relative mx-auto w-full max-w-[520px]"
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Veil lifting off the reliquary */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-30 origin-top rounded-t-full"
        style={{ background: 'linear-gradient(180deg, #8E1B2E, #3A0A14)' }}
        initial={{ scaleY: 1 }}
        whileInView={{ scaleY: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: 0.3, duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* Gilded arch */}
      <div
        className="rounded-t-full p-[2px]"
        style={{ background: 'linear-gradient(180deg, #F6E3A8, #9C7A35 60%, rgba(156,122,53,0.2))' }}
      >
        <div
          className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-t-full"
          style={{
            background:
              'radial-gradient(ellipse at 50% 35%, rgba(246,227,168,0.25), transparent 55%), linear-gradient(180deg, #2A0E16, #120A0D 70%)',
          }}
        >
          <GoldDust density={35} />
          <div className="spin-rev absolute inset-[8%] rounded-full border border-dashed border-gold/25" />
          <div className="spin-slow absolute inset-[18%] rounded-full border border-gold/15" />
          <motion.img
            src={GLASSES}
            alt="Chrome Hearts glasses, front three-quarter view"
            className="relative z-10 w-[88%]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 18px rgba(246,227,168,0.35)) drop-shadow(0 30px 30px rgba(0,0,0,0.8))' }}
          />
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20" style={{ background: shine }} />
          <p className="absolute bottom-6 font-roman text-[0.6rem] uppercase tracking-[0.5em] text-gold/70">Reliquia · I</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Relic() {
  return (
    <section id="relic" className="relative overflow-hidden px-4 py-24 sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 25% 50%, rgba(142,27,46,0.25), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center sm:mb-20">
          <p className="mb-4 font-roman text-xs uppercase tracking-[0.5em] text-gold/80">The one relic</p>
          <h2 className="gilded font-gothic text-6xl leading-none sm:text-8xl">Vitrum Sacrum</h2>
          <Ornament className="mt-8" />
        </FadeIn>

        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <TiltFrame />

          <div className="min-w-0">
            <FadeIn y={20}>
              <p className="font-roman text-xs uppercase tracking-[0.4em] text-rose-bright">Chrome Hearts</p>
              <h3 className="mt-3 font-roman text-3xl font-semibold leading-tight text-marble sm:text-5xl" style={{ textWrap: 'balance' }}>
                Optical frames in black &amp; sterling
              </h3>
              <p className="mt-5 max-w-lg text-xl italic leading-relaxed text-marble/75">
                Worn like a vow. A single pair, kept safe until it finds the face it was made for.
              </p>
            </FadeIn>

            <ol className="mt-10 flex flex-col">
              {COMMANDMENTS.map((c, i) => (
                <FadeIn key={c.n} as="li" delay={i * 0.12} x={40} y={0}>
                  <div className="group flex items-baseline gap-5 border-t border-gold/20 py-5 transition-colors duration-500 hover:border-gold/60">
                    <span className="w-10 shrink-0 font-roman text-2xl text-gold transition-transform duration-500 group-hover:scale-125">
                      {c.n}
                    </span>
                    <div className="min-w-0">
                      <p className="font-roman text-sm uppercase tracking-[0.2em] text-marble">{c.title}</p>
                      <p className="mt-1 text-lg text-marble/65">{c.text}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </ol>

            <FadeIn delay={0.3} className="mt-10 flex flex-wrap items-center gap-6">
              <div>
                <p className="font-roman text-[0.65rem] uppercase tracking-[0.4em] text-gold/70">Offering</p>
                <p className="font-body text-3xl italic text-marble">Price on request</p>
              </div>
              <button type="button" className="holy-btn" onClick={() => seek('Chrome Hearts glasses (the relic)')}>
                Claim this pair
              </button>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
