import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RMBikeAnimation from './RMBikeAnimation';
import { Check } from 'lucide-react';

export default function BookingSuccessAnimation() {
  const [animState, setAnimState] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    // Rev the engine for 1.5s, then blast off (success)
    const t = setTimeout(() => {
      setAnimState('success');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <RMBikeAnimation state={animState} size="xl" />
        
        {/* Success Checkmark that appears after the bike zooms off */}
        {animState === 'success' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-24 h-24 bg-brand-orange rounded-full flex items-center justify-center shadow-2xl shadow-brand-orange/40">
              <Check className="w-12 h-12 text-black" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Service Booked!</h2>
        <p className="text-gray-400 font-medium max-w-sm mx-auto">
          Your bike is in good hands. We've received your booking and will contact you shortly.
        </p>
      </motion.div>
    </div>
  );
}
