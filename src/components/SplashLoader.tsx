import React from 'react';
import { motion } from 'motion/react';

export default function SplashLoader() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[999] bg-[#0A0A0A] flex flex-col items-center justify-center p-6"
    >
      <div className="relative w-40 h-40">
        {/* Animated Geometric Chain/Wheel */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1, 0.8],
              rotate: 360,
            }}
            transition={{ 
              opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.1 },
              scale: { duration: 1.5, repeat: Infinity, delay: i * 0.1 },
              rotate: { duration: 10, repeat: Infinity, ease: "linear" }
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '24px',
              height: '24px',
              margin: '-12px 0 0 -12px',
              backgroundColor: '#FF5A00',
              borderRadius: '4px',
              transform: `rotate(${i * 45}deg) translateY(-50px)`
            }}
            className="neon-glow"
          />
        ))}
        
        {/* Center Logo/Icon */}
        <motion.div 
          animate={{ scale: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-2xl font-black tracking-tighter text-white">
            R.M <span className="text-brand-orange">B.P</span>
          </span>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <h2 className="text-brand-orange text-lg font-black uppercase tracking-[0.3em] mb-2">
          Tuning your ride...
        </h2>
        <div className="flex items-center justify-center gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          ))}
        </div>
      </motion.div>
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full" />
    </motion.div>
  );
}
