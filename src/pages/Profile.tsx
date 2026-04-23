import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatPrice, cn } from '../lib/utils';
import { Package, Calendar, Clock, CheckCircle, Truck, XCircle, User, LogOut, Shield, Star, Gift, ArrowUpRight, ArrowDownRight, Heart, ShoppingCart, Camera, Upload, Zap, ShieldCheck, Droplets, Hammer, Settings, ChevronDown, ListFilter, Info, Bell, Home, ArrowRight, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getUserPoints, getLoyaltyTransactions, LoyaltyTransaction } from '../services/loyaltyService';
import { useWishlistStore } from '../store/useWishlistStore';
import OrderTracking from '../components/OrderTracking';
import { useCartStore } from '../store/useCartStore';
import { Skeleton, OrderSkeleton } from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';

// New Components
import MobileHeader from '../components/profile/MobileHeader';
import ProfileCard from '../components/profile/ProfileCard';
import DashboardGrid from '../components/profile/DashboardGrid';
import QuickActions from '../components/profile/QuickActions';
import StatsGrid from '../components/profile/StatsGrid';
import BlogSection from '../components/blog/BlogSection';
import CreatePost from '../components/blog/CreatePost';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

interface Booking {
  id: string;
  bikeModel: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  createdAt: any;
}

export default function Profile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'bookings' | 'loyalty' | 'wishlist' | 'settings' | 'notifications'>('dashboard');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastBookingDoc, setLastBookingDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreBookings, setHasMoreBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlistStore();
  const addToCart = useCartStore(state => state.addItem);

  const isAdmin = useMemo(() => auth.currentUser?.email === 'chakrabortytamanash@gmail.com', [auth.currentUser]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/auth', { state: { from: location } });
      }
    });

    if (!auth.currentUser) {
      navigate('/auth', { state: { from: location } });
      return;
    }

    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDisplayName(data.displayName || auth.currentUser?.displayName || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      }
    });

    const qOrders = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const qBookings = query(
      collection(db, 'bookings'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
      if (snap.docs.length > 0) {
        setLastBookingDoc(snap.docs[snap.docs.length - 1]);
        setHasMoreBookings(snap.docs.length === 5);
      } else {
        setHasMoreBookings(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    const unsubPoints = getUserPoints(auth.currentUser.uid, (points) => {
      setLoyaltyPoints(points);
    });

    const unsubTransactions = getLoyaltyTransactions(auth.currentUser.uid, (txs) => {
      setTransactions(txs);
    });

    return () => {
      unsubscribeAuth();
      unsubUser();
      unsubOrders();
      unsubBookings();
      unsubPoints();
      unsubTransactions();
    };
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Image size must be less than 2MB");
        return;
      }
      setProfilePic(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadProfilePic = async () => {
    if (!profilePic || !auth.currentUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, profilePic);
      const url = await getDownloadURL(storageRef);
      
      // Update Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: url });
      
      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: url
      });
      
      toast.success("Profile picture updated!");
      setPreviewUrl(null);
      setProfilePic(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName,
        phone,
        address
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'shipped': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'delivered':
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const isPastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date < now;
  };

  const getMonthName = (dateStr: string) => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthIndex = parseInt(dateStr.split('-')[1]) - 1;
    return months[monthIndex] || '---';
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'General Service': return Settings;
      case 'Engine Tuning': return Zap;
      case 'Brake Overhaul': return ShieldCheck;
      case 'Oil Change': return Droplets;
      case 'Washing & Polishing': return Droplets;
      case 'Major Repair': return Hammer;
      default: return Settings;
    }
  };

  const loadMoreBookings = async () => {
    if (!auth.currentUser || !lastBookingDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastBookingDoc),
        limit(5)
      );
      const snap = await getDocs(q);
      const newBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(prev => [...prev, ...newBookings]);
      setLastBookingDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMoreBookings(snap.docs.length === 5);
    } catch (error) {
      toast.error("Failed to load more bookings");
    } finally {
      setLoadingMore(false);
    }
  };

  const getBookingStatusStyles = (status: string, date: string) => {
    if (status === 'cancelled') return 'text-red-500 bg-red-500/10 border-red-500/40';
    if (isPastDate(date)) return 'text-gray-500 bg-white/5 border-white/5';
    // Upcoming: Gradient from blue to green
    return 'text-white bg-gradient-to-r from-blue-600 to-emerald-500 border-none shadow-[0_0_15px_rgba(16,185,129,0.2)]';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <div className="flex items-center space-x-6">
          <Skeleton className="w-20 h-20 rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 opacity-50" />
          </div>
        </div>
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-32 rounded-2xl" />)}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-32 pt-32">
       <div className="container-custom space-y-16">
          {/* 1. Header & Navigation Integration Filter */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl border-2 border-brand-orange p-1 shadow-2xl">
                   <img 
                     src={auth.currentUser?.photoURL || ''} 
                     alt="" 
                     className="w-full h-full object-cover rounded-xl" 
                   />
                </div>
                <div>
                   <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{auth.currentUser?.displayName || 'RIDER'}</h1>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{auth.currentUser?.email}</p>
                </div>
             </div>

             <div className="flex gap-2 p-1 bg-white/5 rounded-2xl overflow-x-auto no-scrollbar w-full lg:w-auto">
               {[
                 { id: 'dashboard', label: 'Overview', icon: Home },
                 { id: 'orders', label: 'Orders', icon: Package },
                 { id: 'bookings', label: 'Services', icon: Calendar },
                 { id: 'loyalty', label: 'Rewards', icon: Gift },
                 { id: 'wishlist', label: 'Saved', icon: Heart },
                 { id: 'settings', label: 'Account', icon: User },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={cn(
                     "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                     activeTab === tab.id ? "bg-white text-black" : "text-white/40 hover:text-white"
                   )}
                 >
                   <tab.icon className="w-3 h-3" />
                   {tab.label}
                 </button>
               ))}
             </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-500">
            {activeTab === 'dashboard' ? (
              <div className="space-y-16">
                {/* Profile Overview Stats */}
                <StatsGrid 
                  stats={{
                    orders: orders.length,
                    activeServices: bookings.filter(b => !isPastDate(b.date) && b.status !== 'cancelled').length,
                    wishlist: wishlistItems.length
                  }}
                />

                {/* Admin Creator */}
                {isAdmin && <CreatePost />}

                {/* Blog Section */}
                <section className="space-y-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">RIDER <span className="text-brand-orange">JOURNAL</span></h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Insights from the R.M Workshop</p>
                    </div>
                    <Link to="/blog" className="px-6 py-3 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest hover:border-brand-orange hover:text-brand-orange transition-all">Full Archives</Link>
                  </div>
                  <BlogSection />
                </section>
              </div>
            ) : activeTab === 'orders' ? (
          orders.length === 0 ? (
            <div className="glass p-24 text-center rounded-[3rem] border border-white/10">
              <Package className="w-16 h-16 mx-auto mb-6 text-gray-600 opacity-20" />
              <h3 className="text-2xl font-bold mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-8">You haven't placed any orders for spare parts.</p>
              <button onClick={() => navigate('/shop')} className="bg-brand-orange text-white px-8 py-4 rounded-full font-bold">Start Shopping</button>
            </div>
          ) : (
            orders.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[2.5rem] border border-white/10 overflow-hidden"
              >
                <div className="p-8 border-b border-white/5 flex flex-wrap justify-between items-center gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div>
                      <div className="font-bold">Order #{order.id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Total</div>
                      <div className="text-xl font-bold text-brand-orange">{formatPrice(order.totalAmount)}</div>
                    </div>
                    <div className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border", getStatusColor(order.status))}>
                      {order.status}
                    </div>
                  </div>
                </div>
                
                <div className="px-8 pb-12">
                  <OrderTracking status={order.status as any} />
                </div>

                <div className="p-8 bg-white/5">
                  <div className="flex flex-wrap gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 bg-black/20 p-2 pr-4 rounded-xl border border-white/5">
                        <img src={item.imageUrl || 'https://picsum.photos/seed/part/100/100'} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="text-sm font-bold">{item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )
        ) : activeTab === 'bookings' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Calendar className="w-6 h-6 text-brand-orange" />
                My Bookings
              </h2>
              {bookings.length > 0 && (
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 py-2 px-4 rounded-full border border-white/10">
                  {bookings.filter(b => !isPastDate(b.date) && b.status !== 'cancelled').length} Active Sessions
                </div>
              )}
            </div>

            {bookings.length === 0 ? (
              <div className="glass p-24 text-center rounded-[3rem] border border-white/10">
                <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-600 opacity-20" />
                <h3 className="text-2xl font-bold mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-8">You haven't scheduled any service appointments.</p>
                <button onClick={() => navigate('/booking')} className="bg-brand-orange text-white px-8 py-4 rounded-full font-bold">Book a Service</button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => {
                  const Icon = getServiceIcon(booking.serviceType);
                  const isPast = isPastDate(booking.date);
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <motion.div 
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "glass rounded-[2rem] border transition-all hover:bg-white/5",
                        isPast || isCancelled ? "border-white/5 opacity-80" : "border-white/10"
                      )}
                    >
                      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center space-x-6 w-full md:w-auto">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                            isCancelled ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            isPast ? "bg-white/5 border-white/10 text-gray-600" :
                            "bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border-emerald-500/20 text-emerald-500"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-bold">{booking.bikeModel}</h3>
                              {booking.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            <p className="text-sm font-medium text-gray-400">{booking.serviceType}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                          <div className="flex items-center space-x-4">
                            <div className="text-left md:text-right">
                              <div className="text-sm font-bold flex items-center md:justify-end space-x-2">
                                <Calendar className="w-3 h-3 text-brand-orange" />
                                <span>{booking.date}</span>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center md:justify-end space-x-2 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{booking.time}</span>
                              </div>
                            </div>
                            <div className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border min-w-[100px] text-center", getBookingStatusStyles(booking.status, booking.date))}>
                              {isCancelled ? 'Cancelled' : isPast ? 'Past Service' : booking.status}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center space-x-2"
                          >
                            <Info className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {hasMoreBookings && (
              <div className="text-center pt-8">
                <button 
                  onClick={loadMoreBookings}
                  disabled={loadingMore}
                  className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-full text-sm font-bold border border-white/10 transition-all flex items-center space-x-3 mx-auto"
                >
                  <ChevronDown className={cn("w-4 h-4", loadingMore && "animate-bounce")} />
                  <span>{loadingMore ? 'Loading History...' : 'Load Older Bookings'}</span>
                </button>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-4">Showing most recent 5 bookings</p>
              </div>
            )}
          </div>
        ) : activeTab === 'wishlist' ? (
          wishlistItems.length === 0 ? (
            <div className="glass p-24 text-center rounded-[3rem] border border-white/10">
              <Heart className="w-16 h-16 mx-auto mb-6 text-gray-600 opacity-20" />
              <h3 className="text-2xl font-bold mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-8">Save your favorite parts and bikes for later.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => navigate('/shop')} className="bg-brand-orange text-white px-8 py-4 rounded-full font-bold">Shop Parts</button>
                <button onClick={() => navigate('/bikes')} className="bg-white/10 text-white px-8 py-4 rounded-full font-bold">View Bikes</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map(item => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl overflow-hidden border border-white/10 group"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                      {item.type}
                    </div>
                    <button 
                      onClick={() => {
                        removeWishlistItem(item.id);
                        toast.success(`${item.name} removed from wishlist`);
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-red-500/20 text-white hover:text-red-500 transition-colors border border-white/10"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-black text-brand-orange">{formatPrice(item.price)}</span>
                      {item.type === 'product' ? (
                        <button 
                          onClick={() => {
                            addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl });
                            toast.success(`${item.name} added to cart!`);
                          }}
                          className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate('/bikes')}
                          className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : activeTab === 'loyalty' ? (
          <div className="space-y-8">
            {/* Points Summary Card */}
            <div className="glass p-12 rounded-[3rem] border border-white/10 bg-gradient-to-br from-brand-orange/20 to-transparent relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Your Balance</h3>
                  <div className="flex items-center justify-center md:justify-start space-x-4">
                    <span className="text-6xl font-black text-white">{loyaltyPoints}</span>
                    <div className="bg-brand-orange p-2 rounded-xl">
                      <Star className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                  <p className="text-gray-400 mt-4 max-w-md">Earn points on every purchase and service. Redeem them for exclusive discounts on your next ride.</p>
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <button onClick={() => navigate('/shop')} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-brand-orange/20 hover:scale-105 transition-all">Earn More Points</button>
                  <div className="text-center text-xs text-gray-500 uppercase font-bold tracking-widest">100 Points = ₹10 Discount</div>
                </div>
              </div>
              {/* Decorative Background Icon */}
              <Star className="absolute -bottom-12 -right-12 w-64 h-64 text-brand-orange/5 rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Redemption Options */}
              <div className="lg:col-span-1 space-y-6">
                <h4 className="text-xl font-bold px-4">Redeem Points</h4>
                <div className="space-y-4">
                  {[
                    { points: 500, discount: 50 },
                    { points: 1000, discount: 100 },
                    { points: 2500, discount: 250 },
                    { points: 5000, discount: 500 },
                  ].map((reward) => (
                    <div key={reward.points} className="glass p-6 rounded-3xl border border-white/10 flex items-center justify-between group">
                      <div>
                        <div className="text-lg font-bold">₹{reward.discount} Off</div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{reward.points} Points</div>
                      </div>
                      <button 
                        disabled={loyaltyPoints < reward.points}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                          loyaltyPoints >= reward.points 
                            ? "bg-brand-orange text-white hover:scale-105" 
                            : "bg-white/5 text-gray-600 cursor-not-allowed"
                        )}
                      >
                        Redeem
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction History */}
              <div className="lg:col-span-2 space-y-6">
                <h4 className="text-xl font-bold px-4">Point History</h4>
                <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">No point transactions yet.</div>
                    ) : (
                      transactions.map((tx) => (
                        <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              tx.type === 'earn' ? "bg-green-500/10 text-green-500" : "bg-brand-orange/10 text-brand-orange"
                            )}>
                              {tx.type === 'earn' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{tx.reason}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'Just now'}
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "text-lg font-black",
                            tx.type === 'earn' ? "text-green-500" : "text-brand-orange"
                          )}>
                            {tx.type === 'earn' ? '+' : ''}{tx.points}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Bell className="w-6 h-6 text-brand-orange" />
                Notifications
              </h2>
            </div>
            <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden bg-[#121212]">
              <div className="p-8">
                <p className="text-gray-500 mb-8">Stay updated with your service progress and order status.</p>
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                   {/* We can reuse the logic here or just a message to check the header for real-time updates */}
                   <p className="text-sm text-gray-400">Please use the notification center in the top header for real-time alerts and management.</p>
                   <p className="text-xs text-gray-600 mt-2 italic">A full history view is being integrated.</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl mx-auto">
            <div className="glass p-8 md:p-12 rounded-[3rem] border border-white/10">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <User className="w-6 h-6 text-brand-orange" />
                Profile Settings
              </h2>

              {/* Profile Picture Section */}
              <div className="mb-10 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-orange/20 p-1 relative">
                    <img 
                      src={previewUrl || auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}&background=random`} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover rounded-full"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 bg-brand-orange text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform border-4 border-black">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                {previewUrl && !uploading && (
                  <button 
                    onClick={uploadProfilePic}
                    className="mt-4 flex items-center space-x-2 text-brand-orange font-bold text-sm hover:underline"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Selected Image</span>
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-4">Upload a JPG or PNG (Max 2MB)</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={auth.currentUser?.email || ''} 
                    disabled 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Email address cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 62893 28280"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Delivery Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-orange transition-colors min-h-[120px]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass rounded-[2.5rem] border border-white/10 p-8 overflow-hidden"
            >
              <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>

              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                  {React.createElement(getServiceIcon(selectedBooking.serviceType), { className: "w-6 h-6 text-brand-orange" })}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Booking Details</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">#{selectedBooking.id.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-1">Bike Model</div>
                    <div className="font-bold">{selectedBooking.bikeModel}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-1">Service Type</div>
                    <div className="font-bold">{selectedBooking.serviceType}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-1">Date</div>
                    <div className="font-bold flex items-center space-x-2">
                       <Calendar className="w-4 h-4 text-brand-orange" />
                       <span>{selectedBooking.date}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 uppercase mb-1">Time Slot</div>
                    <div className="font-bold flex items-center space-x-2">
                       <Clock className="w-4 h-4 text-brand-orange" />
                       <span>{selectedBooking.time}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-500 uppercase">Current Status</span>
                    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", getBookingStatusStyles(selectedBooking.status, selectedBooking.date))}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 italic">
                    {selectedBooking.status === 'pending' && "Our team is reviewing your appointment. We'll contact you shortly."}
                    {selectedBooking.status === 'confirmed' && "Your appointment is confirmed. Please arrive 10 minutes prior to your slot."}
                    {selectedBooking.status === 'completed' && "Service finished. We hope your ride feels smoother now!"}
                    {selectedBooking.status === 'cancelled' && "This booking was cancelled. Feel free to schedule a new one."}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
