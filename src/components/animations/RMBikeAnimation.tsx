import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RMBikeAnimationProps {
  state?: 'idle' | 'loading' | 'success' | 'tracking';
  progress?: number; // 0 to 100 for tracking
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
};

export default function RMBikeAnimation({ 
  state = 'idle', 
  progress = 0,
  size = 'md',
  className 
}: RMBikeAnimationProps) {
  
  // High-end sports bike SVG paths (Ather/KTM aesthetic)
  // Sharp angles, aggressive forward lean
  const chassisPath = "M25 60 L40 35 L70 35 L80 45 L95 45 L85 60 Z M50 35 L60 20 L75 25 L70 35 Z";
  const frontForks = "M75 45 L85 70";
  const rearSwingarm = "M30 60 L15 70";

  // Animation variants
  const bikeVariants = {
    idle: {
      y: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    loading: {
      y: [0, -2, 0, 1, 0],
      x: [0, 1, 0, -1, 0],
      transition: { duration: 0.1, repeat: Infinity, ease: "linear" } // Engine vibration
    },
    success: {
      rotate: [0, -15, -15, 0], // Pop a wheelie
      x: [0, 50, 200, 300],    // Zoom off
      opacity: [1, 1, 0, 0],
      transition: { duration: 1.5, ease: "anticipate" }
    },
    tracking: {
      // Progress handled by parent wrapper positioning
      y: [0, -1, 0],
      transition: { duration: 0.5, repeat: Infinity }
    }
  };

  const wheelVariants = {
    idle: { rotate: 0 },
    loading: {
      rotate: 360,
      transition: { duration: 0.5, repeat: Infinity, ease: "linear" }
    },
    success: {
      rotate: 720,
      transition: { duration: 1, ease: "easeIn" }
    },
    tracking: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: "linear" }
    }
  };

  const speedLineVariants = {
    hidden: { opacity: 0, x: 0 },
    visible: {
      opacity: [0, 1, 0],
      x: [0, -50],
      transition: { duration: 0.3, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <motion.svg
        viewBox="0 0 120 100"
        className="w-full h-full drop-shadow-2xl"
        variants={bikeVariants}
        animate={state}
      >
        <defs>
          <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#FF3B30" />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Speed lines (only visible in loading/tracking) */}
        {(state === 'loading' || state === 'tracking') && (
          <g className="text-white/20" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <motion.line x1="20" y1="50" x2="40" y2="50" variants={speedLineVariants} initial="hidden" animate="visible" />
            <motion.line x1="10" y1="40" x2="35" y2="40" variants={speedLineVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} />
            <motion.line x1="30" y1="70" x2="50" y2="70" variants={speedLineVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} />
          </g>
        )}

        {/* Body / Chassis */}
        <path d={chassisPath} fill="white" className="drop-shadow-lg" />
        
        {/* Aggressive Red Accent (Tank/Fairing) */}
        <path d="M50 35 L60 20 L75 25 Z" fill="url(#redGlow)" filter="url(#neonGlow)" />

        {/* Forks & Swingarm */}
        <path d={frontForks} stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d={rearSwingarm} stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* Headlight Flare */}
        <circle cx="75" cy="45" r="2" fill="white" filter="url(#neonGlow)" />
        <polygon points="75,45 100,35 100,55" fill="white" opacity="0.1" />

        {/* Rear Wheel */}
        <motion.g variants={wheelVariants} animate={state} style={{ originX: '15px', originY: '70px' }}>
          <circle cx="15" cy="70" r="12" fill="none" stroke="#222" strokeWidth="4" />
          <circle cx="15" cy="70" r="9" fill="none" stroke="#FF3B30" strokeWidth="1" opacity="0.5" />
          {/* Rims */}
          <line x1="15" y1="58" x2="15" y2="82" stroke="white" strokeWidth="1.5" />
          <line x1="3" y1="70" x2="27" y2="70" stroke="white" strokeWidth="1.5" />
          <line x1="6.5" y1="61.5" x2="23.5" y2="78.5" stroke="white" strokeWidth="1.5" />
          <line x1="23.5" y1="61.5" x2="6.5" y2="78.5" stroke="white" strokeWidth="1.5" />
        </motion.g>

        {/* Front Wheel */}
        <motion.g variants={wheelVariants} animate={state} style={{ originX: '85px', originY: '70px' }}>
          <circle cx="85" cy="70" r="12" fill="none" stroke="#222" strokeWidth="4" />
          <circle cx="85" cy="70" r="9" fill="none" stroke="#FF3B30" strokeWidth="1" opacity="0.5" />
          {/* Rims */}
          <line x1="85" y1="58" x2="85" y2="82" stroke="white" strokeWidth="1.5" />
          <line x1="73" y1="70" x2="97" y2="70" stroke="white" strokeWidth="1.5" />
          <line x1="76.5" y1="61.5" x2="93.5" y2="78.5" stroke="white" strokeWidth="1.5" />
          <line x1="93.5" y1="61.5" x2="76.5" y2="78.5" stroke="white" strokeWidth="1.5" />
        </motion.g>

        {/* Ground shadow */}
        <ellipse cx="50" cy="88" rx="45" ry="4" fill="black" opacity="0.3" />
      </motion.svg>
    </div>
  );
}
