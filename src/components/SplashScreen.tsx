import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#0D0D0D] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 2.6, ease: "easeInOut" }}
      onAnimationComplete={onAnimationComplete}
    >
      {/* Phase 1: Background Red Glow */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] bg-[#FF3B30] rounded-full blur-[140px] opacity-0"
        animate={{ opacity: [0, 0.12, 0.08] }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      />

      {/* Phase 2–4: RM Logo — matches approved artwork exactly */}
      <motion.div
        className="relative flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* RM Monogram SVG — same paths as rm-app-icon.svg / rm-monogram.svg */}
        <svg
          viewBox="0 0 380 180"
          className="w-[55vw] md:w-[32vw] max-w-[440px] min-w-[220px] drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="translate(40, 20) skewX(-12)" strokeLinejoin="round">
            {/* R letterform */}
            <motion.path
              d="M 0,0 L 150,0 C 200,0 200,80 150,80 L 100,80 L 150,140 L 100,140 L 60,80 L 40,80 L 30,140 L -20,140 Z"
              fill="#F5F5F5"
              stroke="#F5F5F5"
              strokeWidth="4"
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{
                pathLength: { duration: 0.7, ease: "easeInOut" },
                fillOpacity: { duration: 0.35, delay: 0.55, ease: "easeIn" },
              }}
            />
            {/* M letterform */}
            <motion.path
              d="M 170,140 L 210,0 L 260,60 L 310,0 L 280,140 L 240,140 L 260,60 L 220,140 Z"
              fill="#F5F5F5"
              stroke="#F5F5F5"
              strokeWidth="4"
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{
                pathLength: { duration: 0.7, delay: 0.1, ease: "easeInOut" },
                fillOpacity: { duration: 0.35, delay: 0.65, ease: "easeIn" },
              }}
            />
            {/* Red diamond accent — slides in from right */}
            <motion.path
              d="M 300,140 L 330,80 L 360,80 L 330,140 Z"
              fill="#FF3B30"
              initial={{ x: 60, opacity: 0, scale: 0.5 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.85, ease: [0.19, 1, 0.22, 1] }}
            />
          </g>
        </svg>

        {/* BIKE POINT subtitle fades in after logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="flex items-center gap-2 mt-4"
        >
          <span className="text-[#F5F5F5]/50 font-bold tracking-[0.5em] text-xs uppercase">BIKE</span>
          <span className="w-1 h-1 bg-[#FF3B30] rounded-full" />
          <span className="text-[#FF3B30] font-bold tracking-[0.5em] text-xs uppercase">POINT</span>
        </motion.div>

        {/* Phase 3: Metallic sweep reflection */}
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-overlay overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: 1.15 }}
        >
          <motion.div
            className="w-[160%] h-[200%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
            initial={{ x: '-100%', skewX: -20, y: '-25%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.55, delay: 1.15, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
