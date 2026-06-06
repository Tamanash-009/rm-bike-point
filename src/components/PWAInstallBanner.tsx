import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Star, Zap } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const STORAGE_KEY = 'rm_install_prompt_dismissed';
const SHOW_DELAY_MS = 500; // 0.5 seconds after login

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    if (isInstallable) {
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await triggerInstall();
    setInstalling(false);
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop blur */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Banner — slides up from bottom */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[201] px-4 pb-6 pt-2"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="max-w-lg mx-auto bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/80">
              {/* Red accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#FF3B30] via-[#FF6B35] to-[#FF3B30]" />

              <div className="p-6">
                {/* Header row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    {/* App icon */}
                    <img
                      src="/rm-app-icon-source.png"
                      alt="RM Bike Point"
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-black/50 flex-shrink-0"
                    />
                    <div>
                      <p className="text-[10px] font-black tracking-[0.25em] text-[#FF3B30] uppercase mb-0.5">Install App</p>
                      <h3 className="text-xl font-black text-white tracking-tight leading-tight">R.M Bike Point</h3>
                      <p className="text-xs text-white/40 font-medium mt-0.5">Premium Motorcycle Service</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Feature pills */}
                <div className="flex gap-2 mb-5 flex-wrap">
                  {[
                    { icon: Zap, label: 'Works Offline' },
                    { icon: Star, label: 'No App Store' },
                    { icon: Smartphone, label: 'Native Feel' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-[10px] font-bold text-white/50 uppercase tracking-wider"
                    >
                      <Icon className="w-3 h-3 text-[#FF3B30]" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#FF3B30] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#FF3B30]/25 active:scale-95 transition-all disabled:opacity-70"
                  >
                    <Download className="w-4 h-4" />
                    {installing ? 'Installing...' : 'Add to Home Screen'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-5 py-4 rounded-2xl bg-white/5 text-white/50 font-bold text-sm border border-white/8 active:scale-95 transition-all"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
