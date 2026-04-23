import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Search } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useTheme } from '../../contexts/ThemeContext';
import { User as FirebaseUser } from 'firebase/auth';
import ProfileDropdown from './ProfileDropdown';
import GlobalSearch from '../GlobalSearch';

interface DesktopNavbarProps {
  user: FirebaseUser | null;
  onLogin: () => void;
}

export default function DesktopNavbar({ user, onLogin }: DesktopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const cartCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
  const location = useLocation();

  return (
    <div className="hidden lg:flex items-center justify-between w-full h-20 container-custom">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,92,0,0.3)] group-hover:scale-105 transition-transform">
          <span className="text-black font-black italic text-xl">R</span>
        </div>
        <span className="text-lg font-black tracking-tighter text-white uppercase italic">
          Bike <span className="text-brand-orange group-hover:glow-orange transition-all duration-300 underline decoration-white/10 underline-offset-4">Point</span>
        </span>
      </Link>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6 shrink-0">
        <nav className="flex items-center gap-8 mr-4">
           {[
             { name: 'Bikes', href: '/bikes' },
             { name: 'Spares', href: '/shop' },
             { name: 'Services', href: '/booking' }
           ].map(link => (
             <Link 
               key={link.name} 
               to={link.href} 
               className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:text-brand-orange relative group ${location.pathname === link.href ? 'text-brand-orange' : 'text-white/60'}`}
             >
               {link.name}
               <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand-orange transition-all duration-300 origin-left scale-x-0 group-hover:scale-x-100 ${location.pathname === link.href ? 'scale-x-100' : ''}`} />
             </Link>
           ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/5 hover:bg-brand-orange/10 text-white/40 hover:text-brand-orange transition-all border border-transparent hover:border-brand-orange/20"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link 
            to="/cart"
            className="p-2.5 rounded-full bg-white/5 hover:bg-brand-orange/10 text-white/40 hover:text-brand-orange transition-all border border-transparent hover:border-brand-orange/20 relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <ProfileDropdown user={user} />
          ) : (
            <Link 
              to="/auth"
              className="bg-white text-black px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-brand-orange hover:text-white transition-all shadow-xl active:scale-95"
            >
              Rider Account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
