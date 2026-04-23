import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { User } from 'firebase/auth';

interface ProfileCardProps {
  user: User | null;
  isAdmin: boolean;
  onLogout: () => void;
  onAdminRedirect: () => void;
}

export default function ProfileCard({ user, isAdmin, onLogout, onAdminRedirect }: ProfileCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C00]/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-[#FF5C00]/10 transition-colors" />
      
      <div className="flex items-center space-x-4 mb-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#FF5C00]/30 p-1 bg-[#0D0D0D] shadow-[0_0_15px_rgba(255,92,0,0.1)]">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=FF5C00&color=fff`} 
            alt="Profile" 
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-xl font-black text-white truncate leading-tight tracking-tight">{user?.displayName || 'Authentic Rider'}</h2>
          <p className="text-xs text-[#B3B3B3] font-bold uppercase tracking-widest truncate mt-0.5 opacity-60">Member Account</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {isAdmin && (
          <button 
            onClick={onAdminRedirect}
            className="w-full flex items-center justify-center space-x-3 bg-[#FF5C00] hover:bg-[#FF7A33] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_4px_15px_rgba(255,92,0,0.2)] active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>Open Admin Panel</span>
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-white/10 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
