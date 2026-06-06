import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { syncUser } from '../lib/firebase';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // Temporary sync call until firebase custom token integration is complete
      // syncUser(user);
    }
  }, [user]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Shop', href: '/shop' },
    { name: 'Bikes', href: '/bikes' },
    { name: 'Customizer', href: '/customizer' },
    { name: 'Blog', href: '/blog' },
    { name: 'Booking', href: '/booking' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-text-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group" aria-label="RM Bike Point Home">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {/* Approved RM icon */}
                <img
                  src="/icon-512.png"
                  alt="RM Bike Point"
                  className="h-10 w-10 rounded-xl object-cover shadow-lg"
                />
                {/* Brand name - desktop only */}
                <span className="hidden sm:flex flex-col leading-tight">
                  <span className="text-base font-black italic tracking-wider text-white uppercase">RM</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#FF3B30] uppercase">Bike Point</span>
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-orange",
                    location.pathname === link.href ? "text-brand-orange" : "text-text-secondary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && <NotificationCenter />}
            
            <Link to="/wishlist" className="relative p-2 text-text-secondary hover:text-brand-orange transition-colors">
              <Heart className="w-6 h-6" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-text-secondary hover:text-brand-orange transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </Link>

            <SignedIn>
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 group hidden lg:flex">
                  <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">{user?.firstName}</span>
                </Link>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 border border-text-primary/20" } }} />
                {user?.primaryEmailAddress?.emailAddress === "chakrabortytamanash@gmail.com" && (
                  <Link to="/admin" className="text-xs font-bold text-brand-orange hover:text-text-primary transition-colors uppercase tracking-widest">
                    Admin
                  </Link>
                )}
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="bg-brand-orange hover:bg-brand-orange-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
              </SignInButton>
            </SignedOut>

            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-bg-primary border-b border-text-primary/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    location.pathname === link.href ? "text-brand-orange bg-text-primary/5" : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
