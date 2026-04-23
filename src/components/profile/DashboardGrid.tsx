import React from 'react';
import { Home, Package, Heart, Calendar, Bell, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardGridProps {
  activeTab: string;
  onTabChange: (id: any) => void;
  stats: {
    orders: number;
    wishlist: number;
    bookings: number;
  };
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'orders', label: 'History', icon: Package },
  { id: 'wishlist', label: 'Saved', icon: Heart },
  { id: 'bookings', label: 'Services', icon: Calendar },
  { id: 'notifications', label: 'Updates', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DashboardGrid({ activeTab, onTabChange, stats }: DashboardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "relative p-6 rounded-[1.75rem] border transition-all duration-300 flex flex-col items-center justify-center gap-3 group active:scale-[0.96]",
              isActive 
                ? "bg-[#FF5C00] border-[#FF5C00] shadow-[0_10px_30px_rgba(255,92,0,0.3)]" 
                : "bg-[#1A1A1A] border-white/5 hover:border-[#FF5C00]/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              isActive ? "bg-white/20 scale-110" : "bg-white/5 group-hover:bg-[#FF5C00]/10"
            )}>
              <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-white" : "text-[#B3B3B3] group-hover:text-[#FF5C00]")} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.1em]",
              isActive ? "text-white" : "text-[#B3B3B3]"
            )}>
              {item.label}
            </span>
            
            {(item.id === 'orders' && stats.orders > 0) && (
              <span className="absolute top-4 right-4 bg-white text-[#FF5C00] rounded-full text-[9px] w-5 h-5 flex items-center justify-center font-black shadow-lg">
                {stats.orders}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
