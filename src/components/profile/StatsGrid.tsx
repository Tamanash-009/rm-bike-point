import React from 'react';
import { Package, Calendar, Heart } from 'lucide-react';

interface StatsGridProps {
  stats: {
    orders: number;
    activeServices: number;
    wishlist: number;
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-[#B3B3B3] uppercase tracking-[0.2em] px-1">Performance Insight</h3>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#1A1A1A] p-6 rounded-[1.5rem] border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-widest">Total Orders</p>
              <p className="text-xl font-black text-white">{stats.orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-[1.5rem] border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-widest">Active Services</p>
              <p className="text-xl font-black text-white">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-[1.5rem] border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-widest">Saved Items</p>
              <p className="text-xl font-black text-white">{stats.wishlist}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
