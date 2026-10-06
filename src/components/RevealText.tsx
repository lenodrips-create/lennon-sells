import { motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Fragment, useRef } from 'react';

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [12, 0]);
  const blur = useTransform(progress, range, ['blur(6px)', 'blur(0px)']);
  return (
    <motion.span className="inline-block" style={{ opacity, y, filter: blur }}>
      {word}
    </motion.span>
  );
}

// Scripture that illuminates word by word as it scrolls through view.
export default function RevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.35'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <Word word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </p>
  );
}
