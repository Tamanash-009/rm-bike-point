import React from 'react';
import { Calendar, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-[#B3B3B3] uppercase tracking-[0.2em] px-1">Shortcuts</h3>
      <div className="grid grid-cols-1 gap-3">
        <button 
          onClick={() => navigate('/booking')}
          className="flex items-center justify-between p-5 bg-gradient-to-r from-[#FF5C00] to-[#FF8C00] rounded-[1.5rem] text-white group active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(255,92,0,0.2)]"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-black text-lg leading-tight">Book Service</p>
              <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest mt-0.5">Maintain your ride</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        <button 
          onClick={() => navigate('/shop')}
          className="flex items-center justify-between p-5 bg-[#1A1A1A] border border-white/5 rounded-[1.5rem] text-white group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#FF5C00]/10 rounded-xl flex items-center justify-center group-hover:bg-[#FF5C00]/20 transition-colors">
              <ShoppingBag className="w-6 h-6 text-[#FF5C00]" />
            </div>
            <div className="text-left">
              <p className="font-black text-lg leading-tight">Explore Spares</p>
              <p className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-widest mt-0.5">Genuine accessiories</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-[#FF5C00]/30 transition-colors">
            <ArrowRight className="w-5 h-5 text-[#B3B3B3] transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </div>
  );
}
