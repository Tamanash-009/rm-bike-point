import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Shield, LayoutDashboard, Calendar, ShoppingBag, Users, CheckCircle, XCircle, Clock, MessageSquare, Star, Phone, MessageCircle, FileText, BarChart3, ChevronRight } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import AdminQueries from '../components/AdminQueries';
import AdminListings from '../components/AdminListings';
import AdminOrders from '../components/AdminOrders';
import AdminChat from '../components/AdminChat';
import AdminBlog from '../components/AdminBlog';
import AdminLayout from '../components/AdminLayout';
import { awardPoints, LOYALTY_RULES } from '../services/loyaltyService';
import { Skeleton, AdminCardSkeleton } from '../components/Skeleton';

interface Booking {
  id: string;
  userName: string;
  userEmail: string;
  phone: string;
  bikeModel: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isImportant?: boolean;
  createdAt: any;
}

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [queriesCount, setQueriesCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'orders' | 'listings' | 'queries' | 'chat' | 'blog' | 'analytics'>('dashboard');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user is the default admin or has admin role in Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (auth.currentUser.email === "chakrabortytamanash@gmail.com" || userData?.role === 'admin') {
        setIsAdmin(true);
        toast.success("Entered Admin Mode", { id: 'admin-entry' });
        setLoadingData(true);
        Promise.all([
          fetchBookings(),
          fetchStats(),
          fetchRecentActivity()
        ]).finally(() => setLoadingData(false));
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const oSnap = await getDocs(qOrders);
      setRecentOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3));

      const qQueries = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));
      const qSnap = await getDocs(qQueries);
      setRecentQueries(qSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const qSnap = await getDocs(collection(db, 'queries'));
      setQueriesCount(qSnap.size);
      
      const pSnap = await getDocs(collection(db, 'products'));
      const bSnap = await getDocs(collection(db, 'bikes'));
      setListingsCount(pSnap.size + bSnap.size);

      const oSnap = await getDocs(collection(db, 'orders'));
      setOrdersCount(oSnap.size);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { status: newStatus });
      
      const bookingSnap = await getDoc(bookingRef);
      const bookingData = bookingSnap.data();
      
      if (bookingData?.userId) {
        // Create Notification
        await addDoc(collection(db, 'notifications'), {
          userId: bookingData.userId,
          title: 'Service Update',
          message: `Your booking for ${bookingData.bikeModel} has been ${newStatus}.`,
          type: 'service',
          status: 'unread',
          link: '/profile',
          createdAt: serverTimestamp()
        });

        if (newStatus === 'completed') {
          await awardPoints(bookingData.userId, LOYALTY_RULES.BOOKING_POINTS, `Service Completed: ${bookingData.bikeModel}`);
          toast.success(`Booking completed! User earned ${LOYALTY_RULES.BOOKING_POINTS} points.`);
        } else {
          toast.success(`Booking ${newStatus}`);
        }
      }
      
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleBookingImportant = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { isImportant: !current });
      toast.success("Priority updated");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update priority");
    }
  };

  const toggleNoteExpansion = (id: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) return <div className="p-24 text-center">Checking permissions...</div>;

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Shield className="w-24 h-24 text-brand-orange mx-auto mb-8 opacity-20" />
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-8">You do not have administrative privileges to view this page.</p>
        <button onClick={() => window.location.href = '/'} className="bg-white text-black px-8 py-3 rounded-full font-bold">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-orange mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administrative Portal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            {activeTab} <span className="text-white/20">/</span> <span className="text-brand-orange">Control</span>
          </h1>
        </div>
        <p className="text-gray-500 text-sm max-w-xs md:text-right">Manage your business operations with real-time data synchronization.</p>
      </header>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {loadingData ? (
              [...Array(4)].map((_, i) => <AdminCardSkeleton key={i} />)
            ) : (
              <>
                <div className="bg-[#1E1E1E] p-8 rounded-[2rem] border border-white/5 group hover:border-brand-orange/30 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                      <Calendar className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Growth</span>
                      <span className="text-green-500 text-xs font-bold">+12%</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">{bookings.length}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Bookings</div>
                </div>

                <div className="bg-[#1E1E1E] p-8 rounded-[2rem] border border-white/5 group hover:border-green-500/30 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <ShoppingBag className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sales</span>
                      <span className="text-green-500 text-xs font-bold">Stable</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">{ordersCount}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Orders</div>
                </div>

                <div className="bg-[#1E1E1E] p-8 rounded-[2rem] border border-white/5 group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <LayoutDashboard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Inventory</span>
                      <span className="text-blue-500 text-xs font-bold">{listingsCount} items</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">{listingsCount}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Listings</div>
                </div>

                <div className="bg-[#1E1E1E] p-8 rounded-[2rem] border border-white/5 group hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <MessageSquare className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Support</span>
                      <span className="text-purple-500 text-xs font-bold">Direct</span>
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white mb-1">{queriesCount}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Queries</div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-[#1E1E1E] p-4 lg:p-10 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-brand-orange rounded-full" />
                    <span>RECENT ACTIVITY</span>
                  </h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">View All</button>
                </div>
                <div className="space-y-3">
                  {loadingData ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/2 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="w-10 h-10 rounded-2xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-2 w-24 opacity-50" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Recent Bookings */}
                      {bookings.slice(0, 3).map(b => (
                        <div key={b.id} className="bg-white/2 p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-brand-orange/20 transition-all">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/5 flex items-center justify-center border border-brand-orange/10">
                              <Calendar className="w-5 h-5 text-brand-orange" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">Booking: {b.userName}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">{b.bikeModel} • {b.date}</div>
                            </div>
                          </div>
                          <button onClick={() => setActiveTab('bookings')} className="px-5 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-orange hover:bg-brand-orange hover:text-white transition-all shadow-lg hover:shadow-brand-orange/20">Manage</button>
                        </div>
                      ))}
                      
                      {/* Recent Orders */}
                      {recentOrders.map(o => (
                        <div key={o.id} className="bg-white/2 p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-green-500/20 transition-all">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center border border-green-500/10">
                              <ShoppingBag className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">Order: #{o.id.slice(-6).toUpperCase()}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">{formatPrice(o.totalAmount)} • <span className="text-green-500">{o.status}</span></div>
                            </div>
                          </div>
                          <button onClick={() => setActiveTab('orders')} className="px-5 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-orange hover:bg-brand-orange hover:text-white transition-all shadow-lg hover:shadow-brand-orange/20">Details</button>
                        </div>
                      ))}

                      {bookings.length === 0 && recentOrders.length === 0 && (
                        <div className="text-center py-16 opacity-30">
                          <Clock className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-sm font-bold uppercase tracking-widest">Queue is currently empty</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-[#1E1E1E] p-10 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-brand-orange" />
                  <span>Management</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setActiveTab('listings')} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all group overflow-hidden relative">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <LayoutDashboard className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Inventory List</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-orange transition-all relative z-10" />
                  </button>

                  <button onClick={() => setActiveTab('chat')} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all group overflow-hidden relative">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <MessageCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Support Center</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-orange transition-all relative z-10" />
                  </button>

                  <button 
                    onClick={async () => {
                      const idToken = await auth.currentUser?.getIdToken();
                      toast.promise(
                        fetch('/api/admin/process-reminders', { 
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${idToken}` }
                        }).then(r => r.json()),
                        {
                          loading: 'Scanning for due services...',
                          success: (data) => `Success: ${data.count} reminders processed`,
                          error: 'Failed to process reminders'
                        }
                      );
                    }}
                    className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all group overflow-hidden relative"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center group-hover:bg-brand-orange/20 transition-colors">
                        <Clock className="w-5 h-5 text-brand-orange" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Process Reminders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-orange transition-all relative z-10" />
                  </button>
                </div>
              </section>

              <section className="bg-[#1E1E1E] p-10 rounded-[2.5rem] border border-white/5">
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-8">Performance Indices</h4>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                      <span>Conversion Velocity</span>
                      <span className="text-brand-orange">12.5%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "12.5%" }}
                        className="bg-brand-orange h-full shadow-[0_0_10px_rgba(255,106,0,0.5)]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                      <span>System Reliability</span>
                      <span className="text-green-500">98%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "98%" }}
                        className="bg-green-500 h-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      ) : activeTab === 'bookings' ? (
        <section className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/2 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                  <th className="p-8">Customer Affinity</th>
                  <th className="p-8">Bike / Service Asset</th>
                  <th className="p-8">Temporal Data</th>
                  <th className="p-8">Operational Notes</th>
                  <th className="p-8">Status Cycle</th>
                  <th className="p-8">Direct Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/2">
                {bookings.map((booking) => (
                  <tr key={booking.id} className={cn(
                    "hover:bg-white/2 transition-colors group", 
                    booking.isImportant && "bg-brand-orange/5"
                  )}>
                    <td className="p-8">
                      <div className="flex items-center space-x-6">
                        <button onClick={() => toggleBookingImportant(booking.id, !!booking.isImportant)} className="transition-transform active:scale-90">
                          <Star className={cn("w-5 h-5", booking.isImportant ? "text-brand-orange fill-current" : "text-white/10 group-hover:text-white/20")} />
                        </button>
                        <div>
                          <div className="font-bold text-base text-white tracking-tight leading-none mb-2">{booking.userName}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{booking.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="font-bold text-sm text-white mb-1.5">{booking.bikeModel}</div>
                      <div className="text-[10px] text-brand-orange font-bold uppercase tracking-[0.2em]">{booking.serviceType}</div>
                    </td>
                    <td className="p-8">
                      <div className="font-bold text-sm text-white mb-1.5">{booking.date}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{booking.time}</div>
                    </td>
                    <td className="p-8 max-w-[250px]">
                      {booking.notes ? (
                        <div className="space-y-2">
                          <p className={cn(
                            "text-[11px] text-white/40 leading-relaxed",
                            !expandedNotes[booking.id] && "line-clamp-2"
                          )}>
                            {booking.notes}
                          </p>
                          {booking.notes.length > 40 && (
                            <button 
                              onClick={() => toggleNoteExpansion(booking.id)}
                              className="text-[9px] font-black text-brand-orange uppercase tracking-widest hover:text-white transition-colors"
                            >
                              {expandedNotes[booking.id] ? "Minimize Information" : "Access Full Log"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/10 italic font-medium uppercase tracking-widest">Null Log</span>
                      )}
                    </td>
                    <td className="p-8">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                        booking.status === 'pending' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
                        booking.status === 'confirmed' && "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                        booking.status === 'completed' && "bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
                        booking.status === 'cancelled' && "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      )}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(`Hi ${booking.userName}, regarding your booking for ${booking.bikeModel} on ${booking.date}.`);
                            window.open(`https://wa.me/${booking.phone}?text=${msg}`, '_blank');
                          }}
                          className="w-10 h-10 bg-white/5 hover:bg-green-500/20 rounded-xl text-green-500 flex items-center justify-center transition-all group/btn"
                        >
                          <Phone className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="w-10 h-10 bg-white/5 hover:bg-blue-500/20 rounded-xl text-blue-500 flex items-center justify-center transition-all group/btn"
                          >
                            <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="w-10 h-10 bg-white/5 hover:bg-green-500/20 rounded-xl text-green-500 flex items-center justify-center transition-all group/btn"
                          >
                            <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <div className="py-32 text-center">
                 <Calendar className="w-16 h-16 text-white/5 mx-auto mb-6" />
                 <span className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">Historical Data is Empty</span>
              </div>
            )}
          </div>
        </section>
      ) : activeTab === 'queries' ? (
        <AdminQueries />
      ) : activeTab === 'listings' ? (
        <AdminListings />
      ) : activeTab === 'chat' ? (
        <AdminChat />
      ) : activeTab === 'blog' ? (
        <AdminBlog />
      ) : activeTab === 'analytics' ? (
        <div className="p-24 glass rounded-[3rem] border border-white/5 text-center bg-[#1A1A1A]">
           <BarChart3 className="w-16 h-16 mx-auto mb-6 text-brand-orange opacity-40" />
           <h3 className="text-xl font-black uppercase tracking-tighter">Advanced Analytics</h3>
           <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">This section is being synchronized with your real-time sales data. Check back soon for deeper insights.</p>
        </div>
      ) : (
        <AdminOrders />
      )}
    </AdminLayout>
  );
}
