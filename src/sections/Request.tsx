import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import FadeIn from '../components/FadeIn';
import Ornament from '../components/Ornament';
import Petals from '../components/Petals';
import { CONTACT } from '../config';

const SUGGESTIONS = ['Chrome Hearts rings', 'Cross pendant', 'Trucker hat', 'Hoodie', 'Leather', 'Other eyewear'];
const BUDGETS = ['Under $300', '$300 – $750', '$750 – $1,500', '$1,500+', 'Not sure yet'];

interface Request {
  name: string;
  item: string;
  size: string;
  budget: string;
  reach: string;
  note: string;
}

const EMPTY: Request = { name: '', item: '', size: '', budget: '', reach: '', note: '' };

function compose(r: Request) {
  return [
    `Hey Lennon, I'm looking for: ${r.item}`,
    r.size && `Size: ${r.size}`,
    r.budget && `Budget: ${r.budget}`,
    r.note && `Notes: ${r.note}`,
    `From: ${r.name}`,
    `Reach me: ${r.reach}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col gap-2">
      <label htmlFor={id} className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold/90">
        {label}
      </label>
      {children}
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-gold via-[#F6E3A8] to-gold transition-transform duration-700 group-focus-within:scale-x-100" />
    </div>
  );
}

const inputCls =
  'w-full min-w-0 border-0 border-b border-marble/20 bg-transparent pb-3 text-xl text-marble placeholder:italic placeholder:text-marble/30 focus:outline-none focus-visible:outline-none';

// Radiant burst on a successful request
function Burst() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ background: i % 3 ? '#D2AE62' : '#C9402C', boxShadow: '0 0 10px #F4E1A6' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 220, y: Math.sin(a) * 220, opacity: 0, scale: 0.2 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </div>
  );
}

export default function Request() {
  const [req, setReq] = useState<Request>(EMPTY);
  const [sent, setSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onSeek = (e: Event) => {
      const item = (e as CustomEvent<string>).detail;
      setSent(null);
      if (item) setReq((r) => ({ ...r, item }));
      setTimeout(() => itemRef.current?.focus({ preventScroll: true }), 900);
    };
    window.addEventListener('seek', onSeek);
    return () => window.removeEventListener('seek', onSeek);
  }, []);

  const set = (k: keyof Request) => (e: { target: { value: string } }) => setReq((r) => ({ ...r, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = compose(req);
    setSent(text);
    setCopied(false);
    if (CONTACT.email) {
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Seeking: ${req.item}`)}&body=${encodeURIComponent(text)}`;
    }
  };

  const copy = async () => {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="request"
      className="relative overflow-hidden px-4 py-24 sm:px-8 sm:py-32"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(158,43,31,0.3), transparent 70%), linear-gradient(180deg, #0F0A07, #1B130D)',
      }}
    >
      <Petals count={10} />
      <div className="relative mx-auto max-w-4xl">
        <FadeIn className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.45em] text-gold">Requests</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-none text-marble sm:text-6xl">
            Want something <span className="gilded">else?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl italic text-marble/70">
            Rings, pendants, hats, hoodies, anything. Tell me what you&apos;re after and I&apos;ll track it down.
          </p>
          <Ornament className="mt-8" />
        </FadeIn>

        <FadeIn delay={0.2} y={50}>
          <div
            className="relative mt-14 rounded-[2rem] p-[1px]"
            style={{ background: 'linear-gradient(160deg, rgba(244,225,166,0.7), rgba(154,118,51,0.15) 40%, rgba(158,43,31,0.6))' }}
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-ink/90 p-6 backdrop-blur sm:p-12">
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    className="grid gap-8 sm:grid-cols-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="sm:col-span-2">
                      <Field id="seek-item" label="What are you looking for?">
                        <input
                          ref={itemRef}
                          id="seek-item"
                          required
                          value={req.item}
                          onChange={set('item')}
                          placeholder="Chrome Hearts cross ring, size 9"
                          className={inputCls}
                        />
                      </Field>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s, i) => (
                          <motion.button
                            key={s}
                            type="button"
                            onClick={() => setReq((r) => ({ ...r, item: s }))}
                            className={`rounded-full border px-4 py-1.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-colors ${
                              req.item === s
                                ? 'border-gold bg-gold/15 text-gold'
                                : 'border-marble/20 text-marble/60 hover:border-gold/60 hover:text-gold'
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.94 }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <Field id="seek-size" label="Size (optional)">
                      <input id="seek-size" value={req.size} onChange={set('size')} placeholder="M, 9, 54mm" className={inputCls} />
                    </Field>

                    <Field id="seek-budget" label="Budget">
                      <select id="seek-budget" value={req.budget} onChange={set('budget')} className={`${inputCls} appearance-none`}>
                        <option value="" className="bg-umber">
                          Pick a range
                        </option>
                        {BUDGETS.map((b) => (
                          <option key={b} value={b} className="bg-umber">
                            {b}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field id="seek-name" label="Your name">
                      <input id="seek-name" required value={req.name} onChange={set('name')} placeholder="Your name" className={inputCls} />
                    </Field>

                    <Field id="seek-reach" label="How do I reach you?">
                      <input
                        id="seek-reach"
                        required
                        value={req.reach}
                        onChange={set('reach')}
                        placeholder="@instagram, phone or email"
                        className={inputCls}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field id="seek-note" label="Anything else (optional)">
                        <textarea
                          id="seek-note"
                          rows={2}
                          value={req.note}
                          onChange={set('note')}
                          placeholder="Colorway, condition, when you need it"
                          className={`${inputCls} resize-none`}
                        />
                      </Field>
                    </div>

                    <div className="flex justify-center sm:col-span-2">
                      <motion.button type="submit" className="holy-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Send size={14} aria-hidden /> Send request
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="sent"
                    className="relative flex flex-col items-center py-6 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Burst />
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-full border border-gold text-gold"
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
                      style={{ boxShadow: '0 0 40px rgba(210,174,98,0.5)' }}
                    >
                      <Check size={28} aria-hidden />
                    </motion.div>
                    <h3 className="mt-6 font-display text-3xl font-bold text-marble sm:text-4xl">Request ready</h3>
                    <p className="mt-3 max-w-md text-lg italic text-marble/70">
                      {CONTACT.email
                        ? 'Your email app should open with it ready to go. If not, copy it below.'
                        : CONTACT.instagram
                          ? `Copy it and DM it to @${CONTACT.instagram} on Instagram.`
                          : 'Copy it and send it to Lennon.'}
                    </p>
                    <pre className="mt-6 w-full max-w-md whitespace-pre-wrap rounded-2xl border border-gold/20 bg-umber/80 p-5 text-left font-body text-base text-marble/85">
                      {sent}
                    </pre>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      <button type="button" onClick={copy} className="holy-btn">
                        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                        {copied ? 'Copied' : 'Copy request'}
                      </button>
                      {CONTACT.instagram && (
                        <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noreferrer" className="ghost-btn">
                          Open Instagram
                        </a>
                      )}
                      <button type="button" onClick={() => setSent(null)} className="ghost-btn">
                        Request something else
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
