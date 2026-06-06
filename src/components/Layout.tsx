import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-left" toastOptions={{
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
    </div>
  );
}
