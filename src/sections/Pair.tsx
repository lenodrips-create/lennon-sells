import FadeIn from '../components/FadeIn';

const DETAILS = [
  { n: 'I', title: 'Black acetate frame', text: 'Deep black, high-polish finish. Clean from every angle.' },
  { n: 'II', title: 'Sterling silver crosses', text: 'Signature Chrome Hearts cross hardware on both temples.' },
  { n: 'III', title: 'CH logo demo lenses', text: 'Swap in your prescription or wear them as they are.' },
  { n: 'IV', title: 'Full pics on request', text: 'Want every detail before you buy? Just ask.' },
];

export default function Pair() {
  return (
    <section id="pair" className="relative overflow-hidden px-4 py-24 sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(158,43,31,0.18), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-2xl">
        <FadeIn y={20}>
          <p className="text-center text-2xl italic leading-relaxed text-marble/80 sm:text-3xl">
            The kind of pair people ask about. There&apos;s exactly one, and it&apos;s here.
          </p>
        </FadeIn>

        <ol className="mt-12 flex flex-col">
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

        <FadeIn delay={0.3} className="mt-10 border-t border-gold/20 pt-8 text-center">
          <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gold/80">Price</p>
          <p className="mt-1 font-body text-3xl italic text-marble">DM for price</p>
        </FadeIn>
      </div>
    </section>
  );
}
