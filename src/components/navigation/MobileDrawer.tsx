import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Home, 
  ShoppingBag, 
  Calendar, 
  ShoppingCart, 
  Package, 
  Heart, 
  Bell, 
  PhoneCall, 
  LogOut,
  ChevronRight,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  cartCount: number;
}

const groups = [
  {
    title: 'Main Navigation',
    items: [
      { name: 'Home Experience', href: '/', icon: Home },
      { name: 'Explore Spares', href: '/shop', icon: ShoppingBag },
      { name: 'Book Service', href: '/booking', icon: Calendar },
    ]
  },
  {
    title: 'Essential Shop',
    items: [
      { name: 'View Cart', href: '/cart', icon: ShoppingCart },
      { name: 'My Orders', href: '/profile', icon: Package },
      { name: 'Saved Items', href: '/wishlist', icon: Heart },
    ]
  },
  {
    title: 'Account & Support',
    items: [
      { name: 'Alerts & Updates', href: '/profile', icon: Bell },
      { name: 'Rider Support', href: '/contact', icon: PhoneCall },
    ]
  }
];

export default function MobileDrawer({ isOpen, onClose, user, cartCount }: MobileDrawerProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Signed out");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 w-[85%] h-full bg-[#0D0D0D] border-r border-white/5 flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
                  <span className="text-black font-black italic text-xl">R</span>
                </div>
                <span className="text-lg font-black tracking-tighter text-white uppercase italic">
                  Bike <span className="text-brand-orange">Point</span>
                </span>
              </Link>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 no-scrollbar">
              {groups.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h3 className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">{group.title}</h3>
                  <div className="space-y-1.5">
                    {group.items.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all group border border-transparent active:scale-[0.98]",
                          location.pathname === link.href 
                            ? "bg-brand-orange text-black font-black shadow-lg shadow-brand-orange/20" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <link.icon className={cn("w-5 h-5", location.pathname === link.href ? "text-black" : "text-white/20 group-hover:text-brand-orange")} />
                          <span className="text-sm tracking-wide">{link.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {link.href === '/cart' && cartCount > 0 && location.pathname !== '/cart' && (
                             <span className="bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                               {cartCount}
                             </span>
                           )}
                           <ChevronRight className={cn("w-4 h-4 opacity-0 transition-all", location.pathname === link.href ? "opacity-100 -translate-x-1" : "group-hover:opacity-40")} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {user?.email === "chakrabortytamanash@gmail.com" && (
                <div className="space-y-4 pt-4">
                  <h3 className="px-3 text-[10px] font-black text-brand-orange uppercase tracking-[0.25em]">Admin Portal</h3>
                  <Link 
                    to="/admin" 
                    onClick={onClose}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest border border-white active:scale-95"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Control Panel</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-black/40 border-t border-white/5">
              {user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-orange p-1 shadow-lg shadow-brand-orange/10">
                      <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-tight truncate w-40">{user.displayName}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Active Account</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 text-red-500 font-black uppercase tracking-widest text-[11px] border border-white/10 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Secure Logout</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs font-bold text-white/40 mb-4 uppercase tracking-widest">Rider Experience</p>
                  <Link 
                    to="/auth" 
                    onClick={onClose}
                    className="w-full block p-4 rounded-2xl bg-brand-orange text-black font-black uppercase tracking-widest text-sm shadow-lg shadow-brand-orange/20 active:scale-95"
                  >
                    Access Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
