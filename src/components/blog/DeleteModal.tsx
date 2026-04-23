import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, title, loading }: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-card-bg border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Visual background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full -translate-y-12 translate-x-12" />

            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Delete Post?</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed px-4">
                You are about to permanently delete <span className="text-white font-bold">"{title}"</span>. This action cannot be undone and will remove all associated comments.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all active:scale-95"
                  disabled={loading}
                >
                  Keep Post
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-6 py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[11px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
