import React from 'react';
import { motion } from 'framer-motion';
import RMBikeAnimation from './RMBikeAnimation';
import { cn } from '../../lib/utils';

interface TrackingAnimationProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  className?: string;
}

export default function TrackingAnimation({ status, className }: TrackingAnimationProps) {
  // Map status to progress percentage
  const getProgress = () => {
    switch (status) {
      case 'pending': return 10;
      case 'processing': return 40;
      case 'shipped': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const progress = getProgress();

  return (
    <div className={cn("w-full py-8", className)}>
      <div className="relative h-24 max-w-2xl mx-auto">
        {/* Track / Timeline Base */}
        <div className="absolute bottom-4 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div 
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-brand-orange to-[#FF3B30] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* The Bike - Moves along the track */}
        <motion.div
          className="absolute bottom-4 -translate-y-1/2 -translate-x-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut", type: "spring", damping: 15 }}
        >
          {/* Small bike for tracking */}
          <RMBikeAnimation 
            state={status === 'delivered' ? 'idle' : 'tracking'} 
            size="sm" 
            className="w-16 h-16 drop-shadow-[0_0_15px_rgba(255,59,48,0.5)]" 
          />
        </motion.div>

        {/* Status Milestones */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 px-2 translate-y-6">
          <span className={cn(progress >= 10 && "text-white")}>Pending</span>
          <span className={cn(progress >= 40 && "text-brand-orange")}>Processing</span>
          <span className={cn(progress >= 75 && "text-brand-orange")}>Shipped</span>
          <span className={cn(progress >= 100 && "text-green-500")}>Delivered</span>
        </div>
      </div>
    </div>
  );
}
