import React from 'react';
import { motion } from 'framer-motion';

const FloatingOrb: React.FC<{ delay: number; duration: number; x: string; y: string; size: string; opacity: number }> = ({ delay, duration, x, y, size, opacity }) => (
  <motion.div
    className="absolute rounded-full blur-3xl"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: `radial-gradient(circle, hsl(var(--primary) / ${opacity}), transparent 70%)`,
    }}
    animate={{
      y: [0, -30, 0, 20, 0],
      x: [0, 15, -10, 5, 0],
      scale: [1, 1.1, 0.95, 1.05, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

const GridLine: React.FC<{ orientation: 'h' | 'v'; position: string; delay: number }> = ({ orientation, position, delay }) => (
  <motion.div
    className="absolute"
    style={
      orientation === 'h'
        ? { left: 0, right: 0, top: position, height: '1px', background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.04), transparent)' }
        : { top: 0, bottom: 0, left: position, width: '1px', background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.04), transparent)' }
    }
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 6, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle grid */}
      <GridLine orientation="h" position="20%" delay={0} />
      <GridLine orientation="h" position="50%" delay={2} />
      <GridLine orientation="h" position="80%" delay={4} />
      <GridLine orientation="v" position="25%" delay={1} />
      <GridLine orientation="v" position="55%" delay={3} />
      <GridLine orientation="v" position="80%" delay={5} />

      {/* Floating orbs */}
      <FloatingOrb delay={0} duration={20} x="10%" y="15%" size="300px" opacity={0.06} />
      <FloatingOrb delay={3} duration={25} x="70%" y="60%" size="400px" opacity={0.04} />
      <FloatingOrb delay={6} duration={18} x="40%" y="80%" size="250px" opacity={0.05} />
      <FloatingOrb delay={2} duration={22} x="80%" y="10%" size="200px" opacity={0.03} />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
