import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, Calendar, User, Tag, ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  category: string;
  imageUrl: string;
  createdAt: any;
  commentCount?: number;
}

const CATEGORIES = ['All', 'Maintenance', 'Customization', 'Reviews', 'Events', 'Tips'];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const q = query(
      collection(db, 'blogPosts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blogPosts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            R.M Bike Point <span className="text-brand-orange">Blog</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Stay updated with the latest motorcycle maintenance tips, customization trends, and community events.
          </motion.p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-brand-orange/50 transition-colors"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-3xl h-[450px] animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group glass rounded-3xl border border-white/10 overflow-hidden hover:border-brand-orange/30 transition-all duration-500"
              >
                <Link to={`/blog/${post.id}`} className="block relative h-56 overflow-hidden">
                  <img 
                    src={post.imageUrl || `https://picsum.photos/seed/${post.id}/800/600`}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                </Link>

                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-brand-orange transition-colors line-clamp-2">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </h2>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-brand-orange" />
                      <span className="font-bold text-gray-300">{post.authorName}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <Link 
                      to={`/blog/${post.id}`}
                      className="flex items-center gap-2 text-brand-orange text-sm font-bold group/link"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      {post.commentCount || 0}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass rounded-3xl border border-white/10">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-600 opacity-20" />
            <h3 className="text-xl font-bold mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search or category filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
