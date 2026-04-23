import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Clock, Wrench, Star, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Skeleton, ProductSkeleton } from '../components/Skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), limit(4));
        const snap = await getDocs(q);
        setFeaturedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const features = [
    { icon: Shield, title: "Genuine Parts", desc: "We only use 100% original spare parts for your safety." },
    { icon: Clock, title: "Quick Service", desc: "Same-day delivery for most general maintenance tasks." },
    { icon: Wrench, title: "Expert Mechanics", desc: "Certified professionals with years of experience." },
    { icon: Star, title: "Premium Quality", desc: "Top-tier service quality for all motorcycle brands." },
  ];

  const services = [
    { name: "General Service", price: "From ₹999", img: "https://images.unsplash.com/photo-1558981403-c5f91dbbe980?q=80&w=800&auto=format&fit=crop" },
    { name: "Engine Tuning", price: "From ₹1,499", img: "https://images.unsplash.com/photo-1590566276063-471207865913?q=80&w=800&auto=format&fit=crop" },
    { name: "Brake Overhaul", price: "From ₹499", img: "https://images.unsplash.com/photo-1599812182397-3d774f603c75?q=80&w=800&auto=format&fit=crop" },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/motorcycle-hero/1920/1080?blur=2"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-[700px] text-left"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
              PREMIUM BIKE <br />
              <span className="text-brand-orange drop-shadow-[0_0_15px_rgba(255,92,0,0.3)]">SERVICE IN KOLKATA.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/50 mb-10 leading-relaxed max-w-lg">
              The best motorcycle repair shop near you. Experience expert maintenance, genuine parts, and cutting-edge diagnostics for KTM, Yamaha, Royal Enfield & more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/booking"
                className="group relative bg-brand-orange text-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 shadow-2xl shadow-brand-orange/40 hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-sm">Book Service</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.div>
                {/* Visual pulse glow */}
                <div className="absolute -inset-1 bg-brand-orange/20 blur-xl rounded-full animate-pulse -z-10" />
              </Link>
              <Link
                to="/shop"
                className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-white/10 transition-all hover:border-white/20 text-sm"
              >
                Explore Parts
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 right-12 hidden lg:block">
          <div className="glass p-6 rounded-2xl space-y-4 min-w-[200px]">
            <div className="flex items-center space-x-4">
              {loading ? <Skeleton className="h-9 w-12" /> : <div className="text-3xl font-bold text-brand-orange">10k+</div>}
              <div className="text-xs text-gray-400 uppercase tracking-widest">Bikes Serviced</div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center space-x-4">
              {loading ? <Skeleton className="h-9 w-12" /> : <div className="text-3xl font-bold text-brand-orange">4.9</div>}
              <div className="text-xs text-gray-400 uppercase tracking-widest">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-3xl hover:border-brand-orange/50 transition-colors group"
            >
              <f.icon className="w-10 h-10 text-brand-orange mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">FEATURED <span className="text-brand-orange">PARTS</span></h2>
            <div className="flex items-center gap-3">
              <p className="text-gray-400 max-w-xl">Curated selection of top-quality spare parts and accessories for your ride.</p>
              {loading && <span className="text-xs font-black uppercase text-brand-orange animate-pulse">Fetching parts...</span>}
            </div>
          </div>
          <Link to="/shop" className="text-brand-orange font-bold flex items-center space-x-2 hover:underline">
            <span>View Full Shop</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            featuredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl overflow-hidden group border border-white/10 hover:border-brand-orange/50 transition-colors flex flex-col"
              >
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={product.imageUrl || 'https://picsum.photos/seed/part/400/400'} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                    {product.category}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 flex-grow">{product.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-brand-orange font-black text-xl">{formatPrice(product.price)}</span>
                    <Link 
                      to={`/shop/${product.id}`} 
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Services Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">OUR SERVICES</h2>
            <p className="text-gray-400 max-w-xl">We offer a wide range of services to keep your motorcycle in peak condition.</p>
          </div>
          <Link to="/services" className="text-brand-orange font-bold flex items-center space-x-2 hover:underline">
            <span>View All Services</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="relative group overflow-hidden rounded-3xl aspect-[4/5]"
            >
              <img
                src={s.img}
                alt={s.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-bold mb-2">{s.name}</h3>
                <p className="text-brand-orange font-bold mb-6">{s.price}</p>
                <Link
                  to="/booking"
                  className="bg-white text-black px-6 py-3 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Book Now
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[3rem] overflow-hidden metallic-gradient p-12 md:p-24 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter">READY FOR A <br /> SMOOTH RIDE?</h2>
            <p className="text-gray-300 mb-12 text-lg">Join thousands of happy riders who trust R.M Bike Point for their motorcycle needs.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/booking"
                className="glass-button bg-brand-orange text-white px-10 py-4 rounded-full font-bold orange-glow"
              >
                Book Appointment
              </Link>
              <Link
                to="/contact"
                className="glass-button bg-white text-black px-10 py-4 rounded-full font-bold"
              >
                Contact Us
              </Link>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-orange/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-orange/10 blur-[100px] rounded-full" />
        </div>
      </section>
    </div>
  );
}
