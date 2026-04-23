import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, ArrowLeft, Search, ChevronRight, Package, Star } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, limit, getDocs } from 'firebase/firestore';
import { awardPoints, redeemPoints, getUserPoints, LOYALTY_RULES } from '../services/loyaltyService';
import { Skeleton, ProductSkeleton } from '../components/Skeleton';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [userAddress, setUserAddress] = useState('');
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch popular products for empty state
    const fetchPopular = async () => {
      setSuggestionsLoading(true);
      try {
        const q = query(collection(db, 'products'), limit(6));
        const b = query(collection(db, 'bikes'), limit(2));
        const [psnap, bsnap] = await Promise.all([getDocs(q), getDocs(b)]);
        
        const combined = [
          ...psnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'product' })),
          ...bsnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'bike' }))
        ];
        setPopularProducts(combined.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchPopular();

    if (auth.currentUser) {
      setInitialLoading(true);
      const unsubPoints = getUserPoints(auth.currentUser.uid, (pts) => {
        setUserPoints(pts);
        setInitialLoading(false);
      });
      
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'users', auth.currentUser!.uid)).then(snap => {
          if (snap.exists()) {
            setUserAddress(snap.data().address || '');
          }
        });
      });

      return () => unsubPoints();
    } else {
      setInitialLoading(false);
    }
  }, []);

  const discountAmount = pointsToRedeem * LOYALTY_RULES.REDEMPTION_RATE;
  const finalTotal = Math.max(0, total() - discountAmount);

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      toast.error("Please login to place an order.");
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userEmail: auth.currentUser.email,
        deliveryAddress: userAddress || 'Not provided',
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        totalAmount: finalTotal,
        discountAmount,
        pointsRedeemed: pointsToRedeem,
        status: 'paid',
        paymentMethod: 'Simulated Card',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      if (pointsToRedeem > 0) {
        await redeemPoints(auth.currentUser.uid, pointsToRedeem, discountAmount, 'Order Discount');
      }
      
      const pointsEarned = Math.floor(finalTotal * LOYALTY_RULES.POINTS_PER_RS);
      if (pointsEarned > 0) {
        await awardPoints(auth.currentUser.uid, pointsEarned, `Order #${auth.currentUser.uid.slice(-4)}`);
      }

      toast.success(`Order placed! You earned ${pointsEarned} points.`);
      clearCart();
      navigate('/profile');
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary pb-32">
        {/* Mobile Header Navigation */}
        <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-4 md:py-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">CART</h1>
          <Link to="/shop" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Search className="w-6 h-6 text-gray-500" />
          </Link>
        </div>

        {/* Centered Empty State Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-12"
          >
            <div className="relative inline-block mb-8">
               <div className="w-28 h-28 md:w-32 md:h-32 bg-brand-orange/5 border border-brand-orange/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10">
                <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-brand-orange" />
              </div>
              {/* Decorative Glow */}
              <div className="absolute inset-0 bg-brand-orange/20 blur-[40px] rounded-full -z-10 animate-pulse" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">Your cart is <span className="text-brand-orange">Empty</span></h2>
            <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-12">
              Start exploring our premium collection of spare parts and used superbikes to add items to your cart.
            </p>
          </motion.div>

          {/* Enhanced CTA Panel */}
          <div className="max-w-md mx-auto space-y-4 mb-24">
            <motion.div
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/shop"
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(255,92,0,0.3)] orange-glow"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/services" 
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Services</span>
              </Link>
              <Link 
                to="/bikes" 
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 text-brand-orange" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Popular</span>
              </Link>
            </div>
          </div>

          {/* Product Suggestions Horizontal Section */}
          <div className="text-left w-full">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Recommended for <span className="text-brand-orange">You</span></h3>
                <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-brand-orange flex items-center gap-2 hover:underline">
                  See All <ChevronRight className="w-4 h-4" />
                </Link>
             </div>

             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory -mx-4 px-4 scroll-smooth">
                {suggestionsLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[200px]">
                      <Skeleton className="aspect-square rounded-3xl mb-4" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))
                ) : (
                  popularProducts.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex-shrink-0 w-[200px] snap-start"
                    >
                      <Link to={p.type === 'product' ? `/shop/${p.id}` : `/bikes/${p.id}`} className="group">
                        <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-white/5 mb-4 group-hover:border-brand-orange/50 transition-colors">
                          <img 
                            src={p.imageUrl} 
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{p.name}</h4>
                        <p className="text-brand-orange font-black">{formatPrice(p.price)}</p>
                      </Link>
                    </motion.div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-black/60 backdrop-blur-xl -mx-4 sm:-mx-6 px-4 py-4 mb-8 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-black italic uppercase tracking-tighter">Your Cart ({items.length})</span>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      <h1 className="hidden lg:block text-4xl font-bold mb-12 uppercase tracking-tighter italic">SHOPPING <span className="text-brand-orange">CART</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-6 rounded-3xl border border-brand-orange/20 bg-brand-orange/5 flex items-start gap-4">
            <div className="p-2 bg-brand-orange/20 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Cart Notification</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Items in your cart are not reserved. Complete your purchase now to secure your parts! 
                {total() > 2000 && <span className="block mt-1 text-green-500 font-bold">✓ Your order qualifies for Priority Service.</span>}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center gap-6"
              >
                <img
                  src={item.imageUrl || 'https://picsum.photos/seed/part/200/200'}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                  <p className="text-brand-orange font-bold text-lg">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-white/5 rounded-2xl border border-white/10 p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:text-brand-orange transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-black">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:text-brand-orange transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.success(`${item.name} removed from cart`);
                    }}
                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            <button
              onClick={clearCart}
              className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 p-4"
            >
              <Trash2 className="w-4 h-4" />
              Clear Shopping Cart
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {initialLoading ? (
            <div className="glass p-8 rounded-[2.5rem] border border-white/10 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full opacity-50" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : (
            auth.currentUser && userPoints > 0 && (
              <div className="glass p-8 rounded-[2.5rem] border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-brand-orange" />
                  <span className="uppercase italic tracking-tighter">Loyalty Points</span>
                </h3>
                <p className="text-sm text-gray-400 mb-6">Available Balance: <span className="text-white font-bold">{userPoints}</span> pts</p>
                
                <div className="space-y-4">
                  <input 
                    type="range"
                    min="0"
                    max={Math.min(userPoints, total() / LOYALTY_RULES.REDEMPTION_RATE)}
                    step="100"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Apply: {pointsToRedeem} pts</div>
                    <div className="text-sm font-black text-green-500">- {formatPrice(discountAmount)}</div>
                  </div>
                </div>
              </div>
            )
          )}

          <div className="glass p-8 rounded-[2.5rem] border border-white/10 sticky top-24">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-400 text-sm font-bold">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(total())}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-500 text-sm font-bold">
                  <span>Loyalty Discount</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400 text-sm font-bold">
                <span>Shipping & Handling</span>
                <span className="text-green-500 uppercase tracking-widest text-[10px]">Free</span>
              </div>
              <div className="h-px bg-white/5 my-4" />
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Amount</div>
                  <div className="text-4xl font-black text-brand-orange tracking-tighter italic">{formatPrice(finalTotal)}</div>
                </div>
              </div>
            </div>
            
            {!userAddress && auth.currentUser && !initialLoading && (
              <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl border-l-brand-orange border-l-2">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Delivery Address Missing</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">Please update your address in settings to proceed.</p>
                <Link to="/profile" className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                  Update Now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 shadow-lg shadow-brand-orange/20 hover:scale-105 transition-all orange-glow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Secure Checkout</span>
                </>
              )}
            </button>
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Encrypted Transaction
              </p>
              <div className="flex items-center gap-4 opacity-30 grayscale saturate-0">
                <div className="w-8 h-4 bg-white rounded flex items-center justify-center text-[6px] font-black text-black">VISA</div>
                <div className="w-8 h-4 bg-white rounded flex items-center justify-center text-[6px] font-black text-black italic">UPI</div>
                <div className="w-8 h-4 bg-white rounded flex items-center justify-center text-[6px] font-black text-black">RAZOR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
