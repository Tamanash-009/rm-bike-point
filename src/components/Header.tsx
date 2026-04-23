import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { auth, googleProvider, syncUser } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useUIStore } from '../store/useUIStore';

// Navigation Components
import DesktopNavbar from './navigation/DesktopNavbar';
import MobileDrawer from './navigation/MobileDrawer';
import GlobalSearch from './GlobalSearch';

export default function Header() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const cartCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
  const { isDrawerOpen, setDrawerOpen, toggleDrawer } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[110] bg-black/30 backdrop-blur-xl border-b border-white/10 h-20 transition-all duration-300 shadow-lg">
        {/* Desktop View */}
        <DesktopNavbar user={user} onLogin={handleLogin} />

        {/* Mobile View */}
        <div className="lg:hidden flex items-center justify-between w-full h-full px-6 relative">
          <button 
            onClick={toggleDrawer}
            className="p-2.5 rounded-full bg-white/5 text-white/40 hover:text-brand-orange transition-all active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>

          <GlobalSearch className="flex-1 mx-4 max-w-[200px]" />

          <button 
            onClick={() => navigate('/cart')}
            className="p-2.5 rounded-full bg-white/5 text-white/40 hover:text-brand-orange transition-all active:scale-95 relative"
          >
            <Search className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Navigation Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        user={user} 
        cartCount={cartCount} 
      />
    </>
  );
}
