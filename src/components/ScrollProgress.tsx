import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[65] h-[2px] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #9E2B1F, #D2AE62, #F4E1A6)',
        boxShadow: '0 0 12px rgba(210,174,98,0.7)',
      }}
    />
  );
}
