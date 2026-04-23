import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import ChatWidget from './ChatWidget';
import BottomNav from './BottomNav';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-20 relative z-10">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <BottomNav />
      <Toaster position="top-center" toastOptions={{
        className: 'dark:bg-[#1A1A1A] dark:text-white bg-white text-black border border-text-primary/10 rounded-2xl shadow-2xl font-bold',
        style: {
          borderRadius: '24px',
        }
      }} />
    </div>
  );
}
