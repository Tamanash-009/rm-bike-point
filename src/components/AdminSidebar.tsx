import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Package,
  BookOpen,
  X,
  User as UserIcon,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: any;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function AdminSidebar({ isOpen, onClose, activeTab, setActiveTab }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();

  const navigation: NavGroup[] = [
    {
      label: 'Dashboard',
      items: [
        { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Management',
      items: [
        { id: 'orders', name: 'Orders', icon: ShoppingBag },
        { id: 'listings', name: 'Products', icon: Package },
        { id: 'bookings', name: 'Bookings', icon: Calendar },
      ]
    },
    {
      label: 'Communication',
      items: [
        { id: 'queries', name: 'Queries', icon: Users },
        { id: 'chat', name: 'Support', icon: Settings },
      ]
    },
    {
      label: 'Content',
      items: [
        { id: 'blog', name: 'Blog Posts', icon: BookOpen },
      ]
    },
    {
      label: 'Insights',
      items: [
        { id: 'analytics', name: 'Analytics', icon: BarChart3 },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out of Admin Management");
      window.location.href = '/';
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const handleBackToAccount = () => {
    toast.success("Switched to User Mode");
    navigate('/');
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "w-full flex items-center p-3 rounded-2xl transition-all duration-300 relative group min-h-[56px] mb-1",
          isActive 
            ? "bg-brand-orange/10 text-white" 
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        {/* Active Indicator */}
        {isActive && (
          <motion.div 
            layoutId="active-nav"
            className="absolute left-0 w-1 h-6 bg-brand-orange rounded-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        
        <item.icon className={cn(
          "w-5 h-5 shrink-0 transition-colors duration-300",
          isActive ? "text-brand-orange" : "group-hover:text-brand-orange"
        )} />
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-4 text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && !isCollapsed && (
          <ChevronRight className="ml-auto w-4 h-4 text-brand-orange" />
        )}

        {/* Tooltip for collapsed mode */}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-[#1E1E1E] text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-white/5 whitespace-nowrap z-50">
            {item.name}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-[70] glass border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out lg:relative",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-24" : "w-[280px]"
        )}
        style={{ maxWidth: '80%' }}
      >
        {/* Header/Logo */}
        <div className="p-6 border-b border-white/5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              {!isCollapsed && (
                <div>
                  <span className="text-xl font-black text-white tracking-tighter block leading-none">ADMIN</span>
                  <span className="text-[10px] font-black text-brand-orange uppercase tracking-wider">Mode Active</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={onClose}
                className="lg:hidden p-2 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <button
              onClick={handleBackToAccount}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-brand-orange/30 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Account</span>
            </button>
          )}

          {isCollapsed && (
            <button
              onClick={handleBackToAccount}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-brand-orange text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 mx-auto group"
              title="Back to Account"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Section */}
        <div className={cn(
          "px-6 mb-8 transition-all duration-300",
          isCollapsed ? "items-center" : ""
        )}>
          <div className={cn(
            "p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center gap-4 group cursor-default transition-all hover:bg-white/10",
            isCollapsed ? "justify-center px-2" : ""
          )}>
            <div className="w-10 h-10 rounded-full bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-brand-orange" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate">Administrator</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">System Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-8 no-scrollbar scroll-smooth">
          {navigation.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavButton key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/5 mt-auto">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className={cn(
              "w-full flex items-center p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm min-h-[56px] group",
              isCollapsed ? "justify-center p-2" : "gap-4"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Log out Admin</span>}
            {isCollapsed && (
               <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
               Log out Admin
             </div>
            )}
          </button>
        </div>
      </aside>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 blur-[60px] rounded-full" />
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Log out Admin?</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Are you sure you want to log out from the admin portal? You will need to sign back in for system access.</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
