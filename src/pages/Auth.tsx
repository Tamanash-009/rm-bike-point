import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, syncUser, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, ShieldCheck, MailQuestion, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/profile';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUser(result.user);
        toast.success(`Welcome back, Rider!`);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || "Rider authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await syncUser(result.user);
        toast.success("Welcome back to the workshop!");
        navigate(from, { replace: true });
      } else {
        if (!formData.displayName) {
          toast.error("Please provide a rider name");
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(result.user, { displayName: formData.displayName });
        await syncUser(result.user, { displayName: formData.displayName });
        toast.success("Welcome to the R.M Bike Point family!");
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Recovery link sent to your email!");
      setShowForgot(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32 pb-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-[3rem] border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden h-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-brand-orange rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-brand-orange/20 rotate-12">
               <ShieldCheck className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
              {isLogin ? (showForgot ? 'Recover' : 'Log In') : 'Join Us'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
               R.M Bike Point Rider Account
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!showForgot ? (
              <motion.form
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-4">Rider Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                      <input
                        type="text"
                        required
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-brand-orange/50 outline-none transition-all"
                        placeholder="e.g. Maverick 440"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-brand-orange/50 outline-none transition-all"
                      placeholder="rider@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between px-4">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Password</label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => setShowForgot(true)}
                        className="text-[9px] font-black uppercase text-brand-orange hover:text-white transition-colors"
                      >
                        Help?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:border-brand-orange/50 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-orange hover:text-white transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 group"
                  >
                    {loading ? 'Processing...' : (isLogin ? 'Grant Access' : 'Create Account')}
                    {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </div>

                <div className="relative py-4">
                   <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5" />
                   </div>
                   <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.25em]">
                      <span className="bg-[#111] px-4 text-white/20">OR CONTINUIE WITH</span>
                   </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white/60 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 mb-6"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/bx_loader.gif" alt="" className="hidden" />
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Login
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleForgotPassword}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-4">Account Email</label>
                  <div className="relative group">
                    <MailQuestion className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-brand-orange/50 transition-all"
                      placeholder="rider@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(false)}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="p-5 rounded-2xl bg-brand-orange text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-orange/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-10 text-center"
          >
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              {isLogin ? "Don't have an account?" : "Already a community member?"}
              <span className="text-brand-orange ml-2 font-black">
                 {isLogin ? 'Apply for Entry' : 'Log In Now'}
              </span>
            </p>
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-white/20">
           <div className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span>SSL SECURED</span>
           </div>
           <div className="w-px h-3 bg-white/10" />
           <span>24/7 RIDER SUPPORT</span>
        </div>
      </motion.div>
    </div>
  );
}
