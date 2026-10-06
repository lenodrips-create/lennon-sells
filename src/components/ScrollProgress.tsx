import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[65] h-[2px] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #8E1B2E, #D4AF62, #F6E3A8)',
        boxShadow: '0 0 12px rgba(212,175,98,0.7)',
      }}
    />
  );
}
