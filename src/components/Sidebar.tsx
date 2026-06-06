import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  Users, 
  BarChart3, 
  Calendar, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', name: 'Orders Management', icon: ShoppingBag },
    { id: 'listings', name: 'Product Management', icon: Package },
    { id: 'bookings', name: 'Service Bookings', icon: Calendar },
    { id: 'queries', name: 'User Queries', icon: Users },
    { id: 'chat', name: 'Live Support', icon: Settings },
    { id: 'blog', name: 'Blog Posts', icon: Settings }, // Matching existing Admin tabs
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out of Admin");
      window.location.href = '/';
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card-bg border-r border-text-primary/5 flex flex-col z-50 transition-colors duration-300">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black text-text-primary tracking-tighter">ADMIN</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/10" 
                  : "text-text-primary/40 hover:text-text-primary hover:bg-text-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-brand-orange transition-colors")} />
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
              </div>
              {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-text-primary/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
