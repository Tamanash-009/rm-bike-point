import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Package, Bike, Settings, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { ALL_SERVICES } from '../constants/servicesData';
import { useNavigate } from 'react-router-dom';
import { formatPrice, cn } from '../lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'bike' | 'service' | 'blog';
  imageUrl?: string;
  price?: number | string;
  link: string;
}

export default function GlobalSearch({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchLower = val.toLowerCase();
      const allResults: SearchResult[] = [];

      // 1. Search Services (Local)
      const matchedServices = ALL_SERVICES.filter(s => 
        s.name.toLowerCase().includes(searchLower) || s.desc.toLowerCase().includes(searchLower)
      ).slice(0, 3).map(s => ({
        id: s.id,
        title: s.name,
        subtitle: s.category || 'Service',
        type: 'service' as const,
        price: s.price,
        link: '/booking'
      }));
      allResults.push(...matchedServices);

      // 2. Search Products (Firestore)
      const productsSnap = await getDocs(collection(db, 'products'));
      const productResults = productsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(p => p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          title: p.name,
          subtitle: p.brand || 'Spare Part',
          type: 'product' as const,
          imageUrl: p.imageUrl,
          price: p.price,
          link: `/shop` // Could link to detail if exists
        }));
      allResults.push(...productResults);

      // 3. Search Bikes (Firestore)
      const bikesSnap = await getDocs(collection(db, 'bikes'));
      const bikeResults = bikesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(b => b.model.toLowerCase().includes(searchLower) || b.brand.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(b => ({
          id: b.id,
          title: `${b.brand} ${b.model}`,
          subtitle: `${b.year} • ${b.kms} km`,
          type: 'bike' as const,
          imageUrl: b.imageUrl,
          price: b.price,
          link: `/bikes`
        }));
      allResults.push(...bikeResults);

      // 4. Search Blog (Firestore)
      const blogSnap = await getDocs(collection(db, 'blogPosts'));
      const blogResults = blogSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(p => p.title.toLowerCase().includes(searchLower) || p.excerpt.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          title: p.title,
          subtitle: p.category || 'Blog',
          type: 'blog' as const,
          imageUrl: p.imageUrl,
          link: `/blog`
        }));
      allResults.push(...blogResults);

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'bike': return <Bike className="w-4 h-4" />;
      case 'service': return <Settings className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "glass flex items-center gap-3 px-4 py-2 rounded-2xl text-text-primary/40 hover:text-brand-orange hover:border-brand-orange/40 transition-all group max-w-[200px] md:max-w-xs w-full",
          className
        )}
      >
        <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold hidden sm:inline">Search everything...</span>
        <kbd className="hidden lg:flex items-center gap-1 ml-auto px-1.5 py-0.5 rounded border border-text-primary/10 bg-text-primary/5 text-[10px] font-black uppercase">
          <span className="text-[12px]">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl glass rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-text-primary/10 flex items-center gap-4">
                <Search className="w-6 h-6 text-brand-orange" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="What are you looking for?"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-bold placeholder:text-text-primary/20 focus:outline-none"
                />
                {loading ? (
                  <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
                ) : (
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-text-primary/5 transition-colors">
                    <X className="w-6 h-6 text-text-primary/40" />
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {results.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {/* Results are grouped by type internally but displayed mixed or we can group them here */}
                    {['product', 'bike', 'service', 'blog'].map(type => {
                      const typeResults = results.filter(r => r.type === type);
                      if (typeResults.length === 0) return null;

                      return (
                        <div key={type} className="space-y-2 mb-6 last:mb-0">
                          <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-primary/40 mb-2">
                            {type}s
                          </h3>
                          {typeResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => {
                                navigate(result.link);
                                setIsOpen(false);
                              }}
                              className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-text-primary/5 group transition-all text-left border border-transparent hover:border-text-primary/10"
                            >
                              <div className="w-12 h-12 rounded-2xl bg-text-primary/5 overflow-hidden flex items-center justify-center border border-text-primary/10">
                                {result.imageUrl ? (
                                  <img src={result.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-brand-orange">{getTypeIcon(result.type)}</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-text-primary flex items-center gap-2">
                                  {result.title}
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-4 h-4 text-brand-orange" />
                                  </span>
                                </div>
                                <div className="text-sm text-text-primary/40 truncate">{result.subtitle}</div>
                              </div>
                              {result.price && (
                                <div className="text-lg font-black text-brand-orange">
                                  {typeof result.price === 'number' ? formatPrice(result.price) : result.price}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="p-12 text-center text-text-primary/40">
                    <div className="w-16 h-16 rounded-full bg-text-primary/5 flex items-center justify-center mx-auto mb-4 border border-text-primary/10">
                      <Search className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-bold">No results found for "{query}"</p>
                    <p className="text-xs uppercase tracking-widest mt-2">Try a different keyword</p>
                  </div>
                ) : (
                  <div className="p-12 text-center text-text-primary/20">
                    <p className="text-xs uppercase tracking-[0.3em] font-black">Search results will appear here</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-text-primary/5 border-t border-text-primary/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-primary/40">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-sans"><kbd className="px-1 py-0.5 rounded border border-text-primary/10 bg-bg-secondary">ESC</kbd> to close</span>
                </div>
                <div>R.M BIKE POINT GLOBAL SEARCH</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
