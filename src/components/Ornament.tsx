import { motion } from 'framer-motion';

// Gilded divider: two rules drawing out from a laurel sprig.
export default function Ornament({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden>
      <motion.span
        className="h-px w-24 origin-right bg-gradient-to-l from-gold to-transparent sm:w-40"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.svg
        viewBox="0 0 48 24"
        className="h-6 w-12 text-gold"
        initial={{ opacity: 0, scale: 0.4 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <g fill="currentColor">
          <path d="M24 12 C 18 4, 10 4, 4 8 C 10 10, 16 12, 24 12 Z" />
          <path d="M24 12 C 18 20, 10 20, 4 16 C 10 14, 16 12, 24 12 Z" opacity="0.7" />
          <path d="M24 12 C 30 4, 38 4, 44 8 C 38 10, 32 12, 24 12 Z" />
          <path d="M24 12 C 30 20, 38 20, 44 16 C 38 14, 32 12, 24 12 Z" opacity="0.7" />
          <circle cx="24" cy="12" r="2.5" />
        </g>
      </motion.svg>
      <motion.span
        className="h-px w-24 origin-left bg-gradient-to-r from-gold to-transparent sm:w-40"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
