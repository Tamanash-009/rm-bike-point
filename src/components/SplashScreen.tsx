import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#0D0D0D] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, delay: 2.8, ease: 'easeInOut' }}
      onAnimationComplete={onAnimationComplete}
    >
      {/* Red ambient glow behind icon */}
      <motion.div
        className="absolute w-[55vw] h-[55vw] max-w-[500px] max-h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,59,48,0.18) 0%, transparent 70%)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0.7] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* The actual approved RM Bike Point icon */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
      >
        {/* Icon image — exact approved artwork */}
        <motion.img
          src="/icon-512.png"
          alt="RM Bike Point"
          className="w-[42vw] md:w-[22vw] max-w-[260px] min-w-[160px] rounded-[22%] shadow-2xl"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.8, delay: 1.0, ease: [0.19, 1, 0.22, 1] }}
        />

        {/* Metallic shine sweep over the icon */}
        <motion.div
          className="absolute inset-0 rounded-[22%] overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ skewX: -20 }}
            initial={{ x: '-150%' }}
            animate={{ x: '250%' }}
            transition={{ duration: 0.65, delay: 0.75, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Red accent glow ring */}
        <motion.div
          className="absolute -inset-2 rounded-[25%] border border-[#FF3B30]/0"
          animate={{ borderColor: ['rgba(255,59,48,0)', 'rgba(255,59,48,0.5)', 'rgba(255,59,48,0)'] }}
          transition={{ duration: 1.4, delay: 1.0, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Tagline below icon */}
      <motion.p
        className="mt-6 text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        Premium Motorcycle Service
      </motion.p>
    </motion.div>
  );
}
