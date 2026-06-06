import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RMBikeAnimation from './RMBikeAnimation';
import { CheckCircle2 } from 'lucide-react';

interface OrderSuccessAnimationProps {
  orderId: string;
}

export default function OrderSuccessAnimation({ orderId }: OrderSuccessAnimationProps) {
  const [animState, setAnimState] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    // Engine revs then blasts off
    const t = setTimeout(() => {
      setAnimState('success');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="relative">
        <RMBikeAnimation state={animState} size="xl" />
        
        {animState === 'success' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
              <CheckCircle2 className="w-12 h-12 text-black" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-4"
      >
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Payment Successful</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 inline-block">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Order Reference</p>
          <p className="text-2xl font-mono font-bold text-brand-orange">{orderId}</p>
        </div>
        <p className="text-gray-400 font-medium">
          We're prepping your gear. Track your order in your profile.
        </p>
      </motion.div>
    </div>
  );
}
