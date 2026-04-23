import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Package, Heart, BookOpen, LogOut, Shield, ChevronDown } from 'lucide-react';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface ProfileDropdownProps {
  user: FirebaseUser;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = user.email === "chakrabortytamanash@gmail.com";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Signed out successfully");
    setIsOpen(false);
  };

  const menuItems = [
    { label: 'Profile Settings', icon: User, href: '/profile' },
    { label: 'My Orders', icon: Package, href: '/profile' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { label: 'Blog Feed', icon: BookOpen, href: '/blog' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 transition-all group"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-orange transition-all">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=FF5C00&color=fff`} 
            alt={user.displayName || 'User'} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-black text-white leading-none">{user.displayName?.split(' ')[0]}</p>
          <ChevronDown className={`w-3 h-3 text-white/40 mt-1 transition-transform ${isOpen ? 'rotate-180 text-brand-orange' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-64 bg-card-bg border border-white/10 rounded-[1.5rem] shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-5 border-b border-white/5 bg-brand-orange/5">
              <p className="text-xs font-black text-brand-orange uppercase tracking-[0.2em] mb-1">Authenticated Rider</p>
              <p className="text-sm font-bold text-white truncate">{user.email}</p>
            </div>

            <div className="p-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all group"
                >
                  <item.icon className="w-4 h-4 text-white/20 group-hover:text-brand-orange transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-all group mt-1"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Admin Control Panel</span>
                </Link>
              )}
            </div>

            <div className="p-2 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Secure Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
