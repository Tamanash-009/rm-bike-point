import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, auth } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Calendar, User, ArrowRight, MessageSquare, Trash2, Search, Tag, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import DeleteModal from './DeleteModal';

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

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = auth.currentUser?.email === "chakrabortytamanash@gmail.com";

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

  const handleDelete = async () => {
    if (!deleteId || !auth.currentUser) return;
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/posts/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      toast.success("Publication archived successfully");
      setDeleteId(null);
      setPostToDelete(null);
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error("Process failed. Authorization required.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
          <input
            type="text"
            placeholder="Search Publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold placeholder:text-white/20 focus:border-brand-orange/50 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar w-full lg:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border border-transparent",
                selectedCategory === cat 
                  ? "bg-brand-orange text-black border-brand-orange shadow-lg shadow-brand-orange/20" 
                  : "bg-white/5 text-white/40 hover:text-white hover:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-white/5 rounded-[2.5rem] h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-card-bg border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-brand-orange/30 transition-all duration-500 shadow-xl flex flex-col sm:flex-row h-full min-h-[250px]"
            >
              <Link to={`/blog/${post.id}`} className="block relative w-full sm:w-2/5 overflow-hidden min-h-[200px]">
                <img 
                  src={post.imageUrl || `https://picsum.photos/seed/${post.id}/800/600`}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 bg-black/80 backdrop-blur-md text-white text-[9px] font-black rounded-full uppercase tracking-widest border border-white/10">
                    {post.category}
                  </span>
                </div>
              </Link>

              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <h2 className="text-xl font-black mb-3 group-hover:text-brand-orange transition-colors line-clamp-2 leading-tight uppercase italic tracking-tight">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </h2>

                  <div className="flex items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-widest mb-6">
                     <span>{post.authorName}</span>
                     <span className="w-1 h-1 bg-white/10 rounded-full" />
                     <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <Link 
                    to={`/blog/${post.id}`}
                    className="flex items-center gap-2 text-brand-orange text-[10px] font-black uppercase tracking-widest group/link"
                  >
                    Experience Post
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                  
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-black">
                        <MessageSquare className="w-3 h-3" />
                        {post.commentCount || 0}
                     </div>
                     {isAdmin && (
                       <button
                         onClick={() => {
                           setDeleteId(post.id);
                           setPostToDelete(post);
                         }}
                         className="p-2 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                         title="Archive Publication"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10">
          <Search className="w-16 h-16 mx-auto mb-6 text-white/5" />
          <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Zero Results</h3>
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">Your search yielded no publications.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setPostToDelete(null);
        }}
        onConfirm={handleDelete}
        title={postToDelete?.title || ""}
        loading={isDeleting}
      />
    </div>
  );
}
