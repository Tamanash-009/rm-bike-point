import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, ArrowRight, Trash2, Bike } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { formatPrice } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const handleAddToCart = (item: any) => {
    addItemToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl
    });
    toast.success(`${item.name} added to cart!`);
    removeItem(item.id);
  };

  const handleInquireBike = (item: any) => {
    navigate('/bikes');
    toast.success(`Search for ${item.name} in the Bikes section to inquire.`);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Save your favorite spare parts and bikes here to easily find them later.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/shop"
            className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
          >
            Browse Shop
          </Link>
          <Link
            to="/bikes"
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all"
          >
            View Bikes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 flex items-center space-x-4">
        <Heart className="w-10 h-10 text-brand-orange fill-brand-orange" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">MY <span className="text-brand-orange">WISHLIST</span></h1>
          <p className="text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-3xl overflow-hidden group border border-white/10 hover:border-brand-orange/30 transition-all flex flex-col"
          >
            <div className="aspect-video overflow-hidden relative">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                {item.type === 'bike' ? 'Pre-Owned Bike' : 'Spare Part'}
              </div>
              <button
                onClick={() => {
                  removeItem(item.id);
                  toast.success(`${item.name} removed from wishlist`);
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-colors z-10"
                title="Remove from wishlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col flex-grow space-y-4">
              <h3 className="text-xl font-bold line-clamp-2 flex-grow">{item.name}</h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-2xl font-bold text-brand-orange">{formatPrice(item.price)}</span>
                
                {item.type === 'product' ? (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-white/10 hover:bg-brand-orange text-white p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-xs font-bold pr-1">Add</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleInquireBike(item)}
                    className="bg-white/10 hover:bg-brand-orange text-white p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 flex items-center space-x-2"
                  >
                    <Bike className="w-5 h-5" />
                    <span className="text-xs font-bold pr-1">View</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
