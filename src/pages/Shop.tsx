import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Star, Check, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import ReviewSystem from '../components/ReviewSystem';
import { X } from 'lucide-react';
import { BIKE_BRANDS, BIKE_MODELS_BY_BRAND, ALL_MODELS, SPARE_PART_CATEGORIES } from '../constants/bikeData';

interface Product {
  id: string;
  name: string;
  brand?: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  bikeModels?: string[];
}

import { ProductSkeleton, Skeleton } from '../components/Skeleton';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedBikeModel, setSelectedBikeModel] = useState('All');
  const addItem = useCartStore((state) => state.addItem);
  const { addItem: addWishlistItem, removeItem: removeWishlistItem, isInWishlist } = useWishlistStore();

  const categories = SPARE_PART_CATEGORIES;
  
  const allBrands = ['All', ...BIKE_BRANDS];
  const allBikeModels = selectedBrand === 'All' 
    ? ['All', ...ALL_MODELS] 
    : ['All', ...(BIKE_MODELS_BY_BRAND[selectedBrand] || [])];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) || 
      (p.brand?.toLowerCase().includes(searchLower)) ||
      (p.bikeModels?.some(m => m.toLowerCase().includes(searchLower)));
    
    const matchesCategory = category === 'All' || p.category === category;
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    const matchesBikeModel = selectedBikeModel === 'All' || p.bikeModels?.includes(selectedBikeModel);

    return matchesSearch && matchesCategory && matchesPrice && matchesBrand && matchesBikeModel;
  });

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleContactInquiry = async (product: Product) => {
    try {
      await addDoc(collection(db, 'queries'), {
        name: 'Product Inquiry', // Ideally we'd get the user's name if logged in
        email: 'inquiry@rmbikepoint.com',
        phone: '',
        subject: `Inquiry: ${product.name}`,
        message: `I am interested in ${product.name} (Price: ${formatPrice(product.price)}). Please provide more details.`,
        status: 'new',
        isImportant: true,
        createdAt: serverTimestamp()
      });
      toast.success("Inquiry sent! We will contact you soon.");
    } catch (error) {
      toast.error("Failed to send inquiry.");
    }
  };

  const toggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeWishlistItem(product.id);
      toast.success(`${product.name} removed from wishlist`);
    } else {
      addWishlistItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        type: 'product'
      });
      toast.success(`${product.name} added to wishlist`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-6">SPARE <span className="text-brand-orange">PARTS</span></h1>
        <p className="text-gray-400 max-w-2xl">Genuine spare parts and premium accessories for your motorcycle. Quality guaranteed.</p>
      </header>

      {/* Browse by Brand */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 flex items-center space-x-3">
          <div className="w-2 h-8 bg-brand-orange rounded-full" />
          <span>Browse by Brand</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 space-y-3">
                <Skeleton className="w-10 h-10 mx-auto rounded-xl" />
                <Skeleton className="h-2 w-12 mx-auto" />
              </div>
            ))
          ) : (
            BIKE_BRANDS.map((brand) => (
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
          )))}
        </div>
      </section>

      {/* Filters */}
      <div className="space-y-6 mb-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, brand, or bike model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                  category === cat 
                    ? "bg-brand-orange border-brand-orange text-white" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Part Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:outline-none focus:border-brand-orange transition-colors appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-black">{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Filter by Brand</label>
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:outline-none focus:border-brand-orange transition-colors appearance-none"
            >
              {allBrands.map(brand => (
                <option key={brand} value={brand} className="bg-black">{brand}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Shop by Bike Model</label>
            <select 
              value={selectedBikeModel}
              onChange={(e) => setSelectedBikeModel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:outline-none focus:border-brand-orange transition-colors appearance-none"
            >
              {allBikeModels.map(model => (
                <option key={model} value={model} className="bg-black">{model}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Max Price: {formatPrice(priceRange[1])}</label>
            <input 
              type="range"
              min="0"
              max="50000"
              step="500"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-orange"
            />
          </div>
        </div>

        {(category !== 'All' || selectedBrand !== 'All' || selectedBikeModel !== 'All' || search !== '') && (
          <button 
            onClick={() => {
              setCategory('All');
              setSelectedBrand('All');
              setSelectedBikeModel('All');
              setSearch('');
              setPriceRange([0, 50000]);
            }}
            className="flex items-center space-x-2 text-xs font-bold text-brand-orange hover:text-white transition-colors ml-4"
          >
            <X className="w-3 h-3" />
            <span>RESET ALL FILTERS</span>
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="mb-6 flex items-center gap-3">
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-orange rounded-full animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-brand-orange">Fetching parts...</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => <ProductSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl overflow-hidden group border border-white/10 hover:border-brand-orange/30 transition-all"
            >
              <Link to={`/shop/${product.id}`} className="block aspect-square overflow-hidden relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <span className="text-white font-bold flex items-center gap-2">
                    View Details <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-orange border border-white/10">
                  {product.category}
                </div>
              </Link>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold group-hover:text-brand-orange transition-colors">{product.name}</h3>
                    {product.brand && <p className="text-xs text-gray-500 font-medium">{product.brand}</p>}
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-xs font-bold">4.8</span>
                  </div>
                </div>
                
                {product.bikeModels && product.bikeModels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.bikeModels.slice(0, 3).map(model => (
                      <span key={model} className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-gray-400">
                        {model}
                      </span>
                    ))}
                    {product.bikeModels.length > 3 && (
                      <span className="text-[9px] text-gray-500">+{product.bikeModels.length - 3} more</span>
                    )}
                  </div>
                )}

                <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="glass-button neon-glow bg-brand-orange text-white p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-xs font-bold pr-1">Add</span>
                  </button>
                </div>
                <div className="flex items-center text-[10px] text-gray-500 space-x-2">
                  <Check className={cn("w-3 h-3", product.stock > 0 ? "text-green-500" : "text-red-500")} />
                  <span>{product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-gray-500 text-xl">No products found matching your search.</p>
        </div>
      )}
    </div>
  );
}
