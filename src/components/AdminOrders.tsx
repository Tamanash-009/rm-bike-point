import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatPrice, cn } from '../lib/utils';
import { ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { OrderSkeleton } from './Skeleton';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: any;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.userId,
          title: 'Order Update',
          message: `Your order #${orderId.slice(-4)} status has been updated to ${newStatus}.`,
          type: 'order',
          status: 'unread',
          link: '/profile',
          createdAt: serverTimestamp()
        });
      }

      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => <OrderSkeleton key={i} />)}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Order Fulfillment</h2>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{orders.length} ACTIVE PIPELINE ITEMS</p>
        </div>
        
        <div className="flex bg-[#1E1E1E] p-2 rounded-2xl border border-white/5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">New</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Process</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Done</span>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#1E1E1E] p-32 text-center rounded-[3rem] border border-white/5 border-dashed">
          <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-white/5" />
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Transaction log is empty</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div 
              layout
              key={order.id} 
              className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-brand-orange/20 transition-all duration-300"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex flex-wrap justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-orange/5 rounded-[1.5rem] flex items-center justify-center border border-brand-orange/10 relative group">
                    <Package className="w-8 h-8 text-brand-orange" />
                    <div className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#1E1E1E]">
                      {order.items.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1.5">Dispatch Code</div>
                    <div className="font-black text-2xl text-white tracking-tight leading-none uppercase">#{order.id.slice(-6)}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-12">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Recipient</div>
                    <div className="font-bold text-white text-base leading-none mb-1.5">{order.userName}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.userEmail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Volume</div>
                    <div className="text-2xl font-black text-brand-orange tracking-tight">{formatPrice(order.totalAmount)}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.paymentMethod}</div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all",
                    order.status === 'pending' && "bg-yellow-500/5 border-yellow-500/10 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.05)]",
                    order.status === 'processing' && "bg-blue-500/5 border-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.05)]",
                    order.status === 'shipped' && "bg-purple-500/5 border-purple-500/10 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.05)]",
                    order.status === 'delivered' && "bg-green-500/5 border-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.05)]",
                    order.status === 'cancelled' && "bg-red-500/5 border-red-500/10 text-red-500"
                  )}>
                    {getStatusIcon(order.status)}
                    <span className="text-[10px] font-black uppercase tracking-widest">{order.status}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 lg:p-10 bg-white/1">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  <div className="xl:col-span-7 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-4 bg-gray-700 rounded-full" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MANIFEST DETAILS</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/2 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                          <img 
                            src={item.imageUrl || `https://picsum.photos/seed/${item.id || idx}/100/100`} 
                            className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-grow">
                            <div className="font-bold text-xs text-white line-clamp-1">{item.name}</div>
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{formatPrice(item.price)} <span className="text-white/20 px-1">×</span> {item.quantity}</div>
                          </div>
                          <div className="font-black text-xs text-brand-orange">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="xl:col-span-5 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-4 bg-brand-orange rounded-full" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">LOGISTICS CONTROL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                        disabled={order.status !== 'pending'}
                        className="bg-white/5 hover:bg-blue-500 text-white/50 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-blue-500/30 disabled:opacity-20"
                      >
                        Process
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        disabled={order.status !== 'processing'}
                        className="bg-white/5 hover:bg-purple-500 text-white/50 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-purple-500/30 disabled:opacity-20"
                      >
                        Dispatch
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        disabled={order.status !== 'shipped'}
                        className="bg-white/5 hover:bg-green-500 text-white/50 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-green-500/30 disabled:opacity-20"
                      >
                        Finalize
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={order.status === 'cancelled' || order.status === 'delivered'}
                        className="bg-white/5 hover:bg-red-500 text-white/50 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-red-500/30 disabled:opacity-20"
                      >
                        Terminate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
