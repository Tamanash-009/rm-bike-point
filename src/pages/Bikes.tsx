import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike as BikeIcon, Calendar, Gauge, Tag, ArrowRight, MessageCircle, X, Search, Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { formatPrice, cn } from '../lib/utils';
import ReviewSystem from '../components/ReviewSystem';
import { BIKE_BRANDS } from '../constants/bikeData';
import { useWishlistStore } from '../store/useWishlistStore';
import { toast } from 'react-hot-toast';

interface Bike {
  id: string;
  model: string;
  brand: string;
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
}

export default function Bikes() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const { addItem: addWishlistItem, removeItem: removeWishlistItem, isInWishlist } = useWishlistStore();

  const mockBikes: Bike[] = [
    { id: '1', model: 'Interceptor 650', brand: 'Royal Enfield', year: 2022, price: 285000, kms: 4500, description: 'Mint condition, single owner, all service records available.', imageUrl: 'https://images.unsplash.com/photo-1615172282427-9a374635678b?q=80&w=800&auto=format&fit=crop', status: 'available' },
    { id: '2', model: 'Duke 390', brand: 'KTM', year: 2021, price: 210000, kms: 12000, description: 'Well maintained, new tires, performance exhaust.', imageUrl: 'https://images.unsplash.com/photo-1558981424-86a2f1d2a138?q=80&w=800&auto=format&fit=crop', status: 'available' },
    { id: '3', model: 'MT-15', brand: 'Yamaha', year: 2023, price: 155000, kms: 2000, description: 'Almost new, first service done, no scratches.', imageUrl: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=800&auto=format&fit=crop', status: 'available' },
  ];

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'bikes'));
        const fetchedBikes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bike));
        if (fetchedBikes.length > 0) {
          setBikes(fetchedBikes);
        } else {
          setBikes(mockBikes);
        }
      } catch (error) {
        console.error('Error fetching bikes:', error);
        setBikes(mockBikes);
      } finally {
        setLoading(false);
      }
    };
    fetchBikes();
  }, []);

  const filteredBikes = bikes.filter(b => {
    const searchLower = search.toLowerCase();
    const matchesSearch = b.model.toLowerCase().includes(searchLower) || 
                         b.brand.toLowerCase().includes(searchLower);
    const matchesBrand = selectedBrand === 'All' || b.brand === selectedBrand;
    
    return matchesSearch && matchesBrand;
  });

  const toggleWishlist = (e: React.MouseEvent, bike: Bike) => {
    e.stopPropagation();
    if (isInWishlist(bike.id)) {
      removeWishlistItem(bike.id);
      toast.success(`${bike.model} removed from wishlist`);
    } else {
      addWishlistItem({
        id: bike.id,
        name: `${bike.brand} ${bike.model}`,
        price: bike.price,
        imageUrl: bike.imageUrl,
        type: 'bike'
      });
      toast.success(`${bike.model} added to wishlist`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-6">PRE-OWNED <span className="text-brand-orange">BIKES</span></h1>
        <p className="text-gray-400 max-w-2xl mb-8">Quality checked and certified second-hand motorcycles. Ride with confidence.</p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by model or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
      </header>

      {/* Browse by Brand */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 flex items-center space-x-3">
          <div className="w-2 h-8 bg-brand-orange rounded-full" />
          <span>Browse by Brand</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {BIKE_BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand === selectedBrand ? 'All' : brand)}
              className={cn(
                "p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center text-center space-y-2 group",
                selectedBrand === brand 
                  ? "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-brand-orange/50 hover:bg-brand-orange/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110",
                selectedBrand === brand ? "bg-white/20" : "bg-white/5"
              )}>
                {brand[0]}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{brand}</span>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[1, 2].map((i) => (
            <div key={i} className="h-[500px] bg-white/5 animate-pulse rounded-[3rem]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {filteredBikes.map((bike) => (
            <motion.div
              key={bike.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-[3rem] overflow-hidden group border border-white/10 hover:border-brand-orange/30 transition-all"
            >
              <Link to={`/bikes/${bike.id}`} className="block aspect-video overflow-hidden relative">
                <img
                  src={bike.imageUrl}
                  alt={bike.model}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-6 left-6 bg-brand-orange text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                  {bike.status}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-10">
                  <span className="text-white font-bold flex items-center gap-2">
                    View Details <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold mb-2 group-hover:text-brand-orange transition-colors">{bike.model}</h3>
                    <p className="text-gray-500 font-medium">{bike.brand}</p>
                  </div>
                  <div className="text-3xl font-bold text-brand-orange">{formatPrice(bike.price)}</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Calendar className="w-5 h-5 text-brand-orange mx-auto mb-2" />
                    <span className="block text-xs text-gray-500 uppercase">Year</span>
                    <span className="font-bold">{bike.year}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Gauge className="w-5 h-5 text-brand-orange mx-auto mb-2" />
                    <span className="block text-xs text-gray-500 uppercase">KMs</span>
                    <span className="font-bold">{bike.kms.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <Tag className="w-5 h-5 text-brand-orange mx-auto mb-2" />
                    <span className="block text-xs text-gray-500 uppercase">Owner</span>
                    <span className="font-bold">1st</span>
                  </div>
                </div>

                <p className="text-gray-400 leading-relaxed line-clamp-2">{bike.description}</p>

                <div className="flex gap-4 pt-4">
                  <a
                    href={`https://wa.me/916289328280?text=Hi, I'm interested in the ${bike.brand} ${bike.model} (${bike.year})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Inquire</span>
                  </a>
                  <Link 
                    to={`/bikes/${bike.id}`}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all border border-white/10"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
