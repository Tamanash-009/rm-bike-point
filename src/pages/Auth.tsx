import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Info } from 'lucide-react';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32 pb-24 relative overflow-hidden bg-bg-primary">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src="/rm-app-icon.svg" alt="RM Bike Point" className="w-20 h-20 rounded-3xl shadow-2xl shadow-brand-orange/20" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-text-primary">
            Authenticate
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary italic">
             RM Bike Point Rider Account
          </p>
        </div>

        <SignIn fallbackRedirectUrl="/profile" signUpFallbackRedirectUrl="/profile" />

        {/* Support Info */}
        <div className="mt-12 flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-text-secondary">
           <div className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span>SSL SECURED</span>
           </div>
           <div className="w-px h-3 bg-text-primary/10" />
           <span>24/7 RIDER SUPPORT</span>
        </div>
      </div>
    </div>
  );
}
