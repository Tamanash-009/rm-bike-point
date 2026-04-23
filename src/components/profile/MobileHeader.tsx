import React, { useState } from 'react';
import { Menu, Search, Moon, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  theme: string;
  toggleTheme: () => void;
}

export default function MobileHeader({ theme, toggleTheme }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[110] bg-[#0D0D0D]/80 backdrop-blur-2xl border-b border-white/5 py-3 px-6 lg:hidden">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center space-x-2 active:scale-95 transition-transform">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#FF5C00] to-[#FF8C00] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,92,0,0.3)]">
            <span className="text-black font-black text-sm italic">R</span>
          </div>
          <span className="text-lg font-black italic tracking-tighter text-white uppercase">
            Bike <span className="text-[#FF5C00]">Point</span>
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1">
          <button className="p-2.5 text-[#B3B3B3] hover:text-white transition-colors active:scale-90">
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2.5 text-[#FF5C00] transition-all duration-300 active:scale-90"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 text-[#B3B3B3] hover:text-white transition-colors active:scale-90"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 top-[60px] bg-black/60 backdrop-blur-md z-[109]"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-4 right-4 bg-[#1A1A1A] border border-white/10 p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[111] overflow-hidden mt-2"
            >
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { to: '/', label: 'Home' },
                   { to: '/bikes', label: 'Bikes' },
                   { to: '/shop', label: 'Spares' },
                   { to: '/booking', label: 'Service' },
                   { to: '/blog', label: 'Articles' },
                   { to: '/profile', label: 'Profile' }
                 ].map((link) => (
                   <Link 
                    key={link.to}
                    to={link.to} 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-5 rounded-2xl bg-white/5 hover:bg-[#FF5C00] text-white font-black uppercase tracking-widest text-[10px] transition-all text-center border border-white/5 active:scale-95"
                   >
                     {link.label}
                   </Link>
                 ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
