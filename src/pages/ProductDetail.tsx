import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RotateCcw, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { formatPrice, cn } from '../lib/utils';
import ShareButtons from '../components/ShareButtons';
import ReviewSystem from '../components/ReviewSystem';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  bikeModels?: string[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addItem = useCartStore(state => state.addItem);
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isInWishlist = wishlistItems.some(item => item.id === id);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);
          fetchRecommendations(productData.category, id);
        } else {
          toast.error("Product not found");
          navigate('/shop');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `products/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const fetchRecommendations = async (category: string, currentId: string) => {
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', category),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(item => item.id !== currentId);
      setRecommendations(items);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1
      });
      toast.success("Added to cart!");
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        type: 'product'
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

  if (!product) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-[3rem] overflow-hidden glass border border-white/10"
          >
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={toggleWishlist}
              className={cn(
                "absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md border transition-all duration-300",
                isInWishlist 
                  ? "bg-brand-orange border-brand-orange text-white" 
                  : "bg-black/20 border-white/10 text-white hover:bg-white/10"
              )}
            >
              <Heart className={cn("w-6 h-6", isInWishlist && "fill-current")} />
            </button>
          </motion.div>

          {/* Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <span className="px-4 py-1 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl text-gray-400 font-medium">{product.brand}</p>
            </div>

            <div className="text-3xl font-bold text-brand-orange mb-8">
              {formatPrice(product.price)}
            </div>

            <p className="text-gray-400 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>

            {product.bikeModels && product.bikeModels.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Compatible With:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.bikeModels.map(model => (
                    <span key={model} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Warranty</span>
                <span className="text-xs font-bold">1 Year</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <Truck className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Delivery</span>
                <span className="text-xs font-bold">2-4 Days</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                <RotateCcw className="w-6 h-6 text-brand-orange mb-2" />
                <span className="text-[10px] font-bold uppercase text-gray-500">Returns</span>
                <span className="text-xs font-bold">7 Days</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 glass-button neon-glow bg-brand-orange text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            <ShareButtons 
              title={`Check out this ${product.name} at R.M Bike Point!`}
              url={window.location.href}
            />
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mb-24">
          <ReviewSystem targetId={product.id} targetType="product" />
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Star className="w-6 h-6 text-brand-orange" />
              Recommended for your bike
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/shop/${item.id}`}
                  className="group glass rounded-3xl border border-white/10 overflow-hidden hover:border-brand-orange/30 transition-all duration-500"
                >
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 group-hover:text-brand-orange transition-colors line-clamp-1">{item.name}</h3>
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
