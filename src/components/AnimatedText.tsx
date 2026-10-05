import { motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Fragment, useRef } from 'react';
import type { CSSProperties } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
}

function Char({
  char,
  progress,
  range,
}: {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span className="relative">
      <span className="invisible">{char}</span>
      <motion.span className="absolute left-0 top-0" style={{ opacity }}>
        {char}
      </motion.span>
    </span>
  );
}

export default function AnimatedText({ text, className, style }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const total = text.length;
  const words = text.split(' ');
  // Character offset of each word within the full text
  const offsets = words.map((_, i) =>
    words.slice(0, i).reduce((sum, w) => sum + w.length + 1, 0)
  );

  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className="inline-block whitespace-nowrap">
            {word.split('').map((c, ci) => {
              const i = offsets[wi] + ci;
              return (
                <Char
                  key={ci}
                  char={c}
                  progress={scrollYProgress}
                  range={[i / total, (i + 1) / total]}
                />
              );
            })}
          </span>
          {wi < words.length - 1 && ' '}
        </Fragment>
      ))}
    </p>
  );
}
