import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCartStore } from '../store/useCartStore';
import { motion } from 'motion/react';

export default function BottomNav() {
  const cartCount = useCartStore(state => state.items.length);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'shop', label: 'Shop', icon: Search, path: '/shop' },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, path: '/cart', count: cartCount },
    { id: 'wishlist', label: 'Saved', icon: Heart, path: '/wishlist' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[80]">
      <div className="glass backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-brand-orange/5 opacity-50 blur-xl -z-10" />
        
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300",
              isActive ? "text-brand-orange" : "text-gray-500 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-6 h-6", isActive && "animate-bounce")} />
                {isActive && (
                  <motion.div 
                    layoutId="active-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-brand-orange rounded-full"
                  />
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black shadow-lg">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
