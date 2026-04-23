import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { ArrowLeft, Star, Calendar, Gauge, Bike, ShieldCheck, Phone, MessageCircle, Heart } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import ShareButtons from '../components/ShareButtons';
import ReviewSystem from '../components/ReviewSystem';
import { toast } from 'react-hot-toast';
import { useWishlistStore } from '../store/useWishlistStore';

interface BikeListing {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kms: number;
  description: string;
  imageUrl: string;
  images?: string[];
  status: 'available' | 'sold';
  engineCc?: number;
  transmission?: string;
  color?: string;
  vin?: string;
  maintenanceHistory?: string;
}

export default function BikeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bike, setBike] = useState<BikeListing | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [recommendations, setRecommendations] = useState<BikeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isInWishlist = wishlistItems.some(item => item.id === id);

  useEffect(() => {
    if (!id) return;

    const fetchBike = async () => {
      try {
        const docRef = doc(db, 'bikes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const bikeData = { id: docSnap.id, ...docSnap.data() } as BikeListing;
          setBike(bikeData);
          setActiveImage(bikeData.imageUrl);
          fetchRecommendations(bikeData.brand, id);
        } else {
          toast.error("Bike listing not found");
          navigate('/bikes');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `bikes/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBike();
  }, [id, navigate]);

  const fetchRecommendations = async (brand: string, currentId: string) => {
    try {
      const q = query(
        collection(db, 'bikes'),
        where('brand', '==', brand),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BikeListing))
        .filter(item => item.id !== currentId);
      setRecommendations(items);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const toggleWishlist = () => {
    if (!bike) return;
    if (isInWishlist) {
      removeFromWishlist(bike.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: bike.id,
        name: `${bike.brand} ${bike.model}`,
        price: bike.price,
        imageUrl: bike.imageUrl,
        type: 'bike'
      });
      toast.success("Added to wishlist!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bike) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* Image Section */}
          <section className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-[4/3] rounded-[3rem] overflow-hidden glass border border-white/10"
            >
              <img 
                src={activeImage} 
                alt={`${bike.brand} ${bike.model}`}
                className="w-full h-full object-cover transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              {bike.status === 'sold' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-4xl font-black text-white uppercase tracking-widest border-4 border-white px-8 py-4 rotate-12">Sold</span>
                </div>
              )}
            </motion.div>
            
            {/* Thumbnail Gallery */}
            {bike.images && bike.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {bike.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                      activeImage === img ? "border-brand-orange scale-105" : "border-white/5 opacity-50 hover:opacity-100"
                    )}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <span className="px-4 py-1 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest inline-block">
                  Second Hand
                </span>
                <button
                  onClick={toggleWishlist}
                  className={cn(
                    "p-3 rounded-full border transition-all",
                    isInWishlist 
                      ? "bg-brand-orange/10 border-brand-orange text-brand-orange" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-brand-orange/50"
                  )}
                >
                  <Heart className={cn("w-6 h-6", isInWishlist && "fill-brand-orange")} />
                </button>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{bike.brand} {bike.model}</h1>
              <p className="text-xl text-gray-400 font-medium">Model Year: {bike.year}</p>
            </div>

            <div className="text-3xl font-bold text-brand-orange mb-8">
              {formatPrice(bike.price)}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <Calendar className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Year</span>
                <span className="text-xs font-bold">{bike.year}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <Gauge className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Mileage</span>
                <span className="text-xs font-bold">{bike.kms.toLocaleString()} km</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Engine CC</span>
                <span className="text-xs font-bold">{bike.engineCc || 'N/A'}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <Star className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Transmission</span>
                <span className="text-xs font-bold">{bike.transmission || 'Manual'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Color</span>
                <span className="font-bold text-white uppercase tracking-tighter">{bike.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">VIN / Chassis</span>
                <span className="font-bold text-white uppercase tracking-tighter">{bike.vin ? `${bike.vin.slice(0, 4)}****${bike.vin.slice(-4)}` : 'Verified'}</span>
              </div>
            </div>

            <p className="text-gray-400 leading-relaxed mb-8 text-lg">
              {bike.description}
            </p>

            {bike.maintenanceHistory && (
              <div className="mb-12 glass p-8 rounded-[2.5rem] border border-white/10 bg-brand-orange/5">
                 <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                   <ShieldCheck className="w-5 h-5 text-brand-orange" />
                   Maintenance History
                 </h3>
                 <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line italic">
                   {bike.maintenanceHistory}
                 </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a 
                href={`https://wa.me/916289328280?text=I'm interested in the ${bike.brand} ${bike.model} (${bike.year})`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 glass-button neon-glow bg-brand-orange text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                Inquire via WhatsApp
              </a>
              <a 
                href="tel:+916289328280"
                className="flex-1 glass-button border-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
              >
                <Phone className="w-5 h-5" />
                Call Dealer
              </a>
            </div>

            <ShareButtons 
              title={`Check out this ${bike.brand} ${bike.model} at R.M Bike Point!`}
              url={window.location.href}
            />
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mb-24">
          <ReviewSystem targetId={bike.id} targetType="bike" />
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Star className="w-6 h-6 text-brand-orange" />
              Similar Bikes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/bikes/${item.id}`}
                  className="group glass rounded-3xl border border-white/10 overflow-hidden hover:border-brand-orange/30 transition-all duration-500"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.model}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 group-hover:text-brand-orange transition-colors line-clamp-1">{item.brand} {item.model}</h3>
                    <p className="text-brand-orange font-bold text-sm">{formatPrice(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
