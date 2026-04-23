import React from 'react';
import { motion } from 'motion/react';

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-bg-primary" />
      
      {/* Orange Glow/Gradient */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-orange/5 rounded-full blur-[120px]" />

      {/* Abstract Shapes / Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-64 h-64 bg-brand-orange/[0.02] rounded-full blur-3xl"
          animate={{
            x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Subtle Noise/Texture could be added here if needed */}
    </div>
  );
}
