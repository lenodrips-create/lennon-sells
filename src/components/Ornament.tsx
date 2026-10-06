import { motion } from 'framer-motion';

// Gilded divider: two lines drawing out from a cross.
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
        viewBox="0 0 24 24"
        className="h-6 w-6 text-gold"
        initial={{ rotate: -90, opacity: 0, scale: 0.4 }}
        whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <path
          fill="currentColor"
          d="M10.5 2h3v5.2c1.2-.9 2.8-1.2 4.2-.7l-.6 2.8c-1-.3-2.4 0-3.6 1v.2h7.5v3H13.5v.2c1.2 1 2.6 1.3 3.6 1l.6 2.8c-1.4.5-3 .2-4.2-.7V22h-3v-5.2c-1.2.9-2.8 1.2-4.2.7l.6-2.8c1 .3 2.4 0 3.6-1v-.2H3v-3h7.5v-.2c-1.2-1-2.6-1.3-3.6-1l-.6-2.8c1.4-.5 3-.2 4.2.7V2z"
        />
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
