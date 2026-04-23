import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MESSAGES = [
  "Loading your garage...",
  "Fetching spare parts...",
  "Preparing your dashboard...",
  "Tuning the engine...",
  "Polishing the chrome..."
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center p-6"
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Glowing Orb / Morphing Bike Wheel */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: 360,
            borderRadius: ["50%", "30%", "50%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-32 h-32 border-4 border-brand-orange border-t-transparent neon-glow"
        />

        {/* Outer Chain Links / Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              rotate: 360,
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              opacity: { duration: 2, repeat: Infinity, delay: i * 0.1 }
            }}
            className="absolute"
            style={{
              width: '8px',
              height: '24px',
              backgroundColor: '#FF5A00',
              borderRadius: '2px',
              transformOrigin: '0 80px',
              transform: `rotate(${i * 30}deg)`
            }}
          />
        ))}
        
        <motion.div 
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="z-10"
        >
          <span className="text-3xl font-black tracking-tighter text-white">
            R.M <span className="text-brand-orange">B.P</span>
          </span>
        </motion.div>
      </div>

      <div className="mt-12 text-center w-64">
        <div className="h-6 overflow-hidden relative mb-4">
          <AnimatePresence mode="wait">
            <motion.h2
              key={msgIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-brand-orange text-xs font-black uppercase tracking-[0.3em] absolute inset-0 text-center"
            >
              {MESSAGES[msgIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-orange to-transparent w-1/2"
          />
        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/[0.03] blur-[150px] rounded-full pointer-events-none" />
    </motion.div>
  );
}
