import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function AdminLayout({ children, activeTab, setActiveTab }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when switching tabs on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#121212] flex overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-[#1E1E1E] border-b border-white/5 flex items-center px-4 shrink-0 z-50">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-black tracking-tighter text-white">ADMIN</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Toaster position="top-right" toastOptions={{
        className: 'bg-[#1E1E1E] text-white border border-white/10',
        style: {
          borderRadius: '16px',
        }
      }} />
    </div>
  );
}
