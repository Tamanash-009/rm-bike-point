import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, Upload, FileText, Eye, Save, Clock, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  category: string;
  imageUrl: string;
  status: 'draft' | 'published';
  createdAt: any;
}

const CATEGORIES = ['Maintenance', 'Customization', 'Reviews', 'Events', 'Tips'];

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    category: 'Maintenance',
    status: 'draft',
    imageUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blogPosts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSubmitting(true);
    try {
      const postData = {
        ...formData,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Admin',
        updatedAt: serverTimestamp(),
        createdAt: editingPost ? editingPost.createdAt : serverTimestamp()
      };

      if (editingPost) {
        await updateDoc(doc(db, 'blogPosts', editingPost.id), postData);
        toast.success("Post updated!");
      } else {
        await addDoc(collection(db, 'blogPosts'), postData);
        toast.success("Post created!");
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, 'blogPosts');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', id));
      toast.success("Post deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blogPosts/${id}`);
    }
  };

  const openModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData(post);
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Maintenance',
        status: 'draft',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  if (loading) return <div className="p-12 text-center opacity-50 font-black uppercase tracking-[0.4em] text-gray-500">Synchronizing Content...</div>;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Editorial Management</h2>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{posts.length} PUBLISHED ARTICLES</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all shadow-xl shadow-brand-orange/10 transform hover:-translate-y-0.5 active:scale-95"
        >
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span>Create Article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => (
          <motion.div 
            layout
            key={post.id} 
            className="bg-[#1E1E1E] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center justify-between group hover:border-brand-orange/20 transition-all duration-300 gap-8"
          >
            <div className="flex items-center gap-8 flex-1 w-full">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0 relative group/thumb">
                <img 
                  src={post.imageUrl || `https://picsum.photos/seed/${post.id}/200/200`} 
                  alt={post.title}
                  className="w-full h-full object-cover grayscale group-hover/thumb:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-orange/10 mix-blend-overlay" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5 text-gray-400 group-hover:text-brand-orange group-hover:border-brand-orange/20 transition-all">{post.category}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                    post.status === 'published' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                  )}>
                    {post.status}
                  </span>
                </div>
                <h3 className="font-black text-xl text-white tracking-tight line-clamp-1 mb-2 group-hover:text-brand-orange transition-colors">{post.title}</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Drafted'}</span>
                  <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-brand-orange" /> {post.authorName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => openModal(post)}
                className="flex-1 md:flex-none h-12 px-6 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all border border-white/5 flex items-center justify-center gap-3"
              >
                <Edit2 className="w-4 h-4" />
                <span>Configure</span>
              </button>
              <button 
                onClick={() => deletePost(post.id)}
                className="w-12 h-12 bg-white/5 hover:bg-red-500/20 rounded-xl text-red-500 flex items-center justify-center transition-all border border-white/5 hover:border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        
        {posts.length === 0 && (
          <div className="text-center py-32 bg-[#1E1E1E] rounded-[3rem] border border-white/5 border-dashed">
            <FileText className="w-20 h-20 mx-auto mb-6 text-white/5" />
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Historical Log is empty</p>
          </div>
        )}
      </div>

      {/* Modern Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl bg-[#121212] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/5 blur-[100px] pointer-events-none" />

              <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
                <div>
                  <div className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Editor Interface</div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{editingPost ? 'Refine Posting' : 'Draft New Insight'}</h3>
                </div>
                <button onClick={closeModal} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-10 relative z-10 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Article Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="The Future of Urban Commuting..."
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-orange/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Context Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-orange/30 transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-black">{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hero Configuration</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center group relative">
                      {formData.imageUrl ? (
                        <>
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center opacity-20">
                          <Upload className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Media Asset</p>
                        </div>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Direct URI Source</label>
                        <input 
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          placeholder="https://source.unsplash.com/..."
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-xs focus:outline-none focus:border-brand-orange/30 transition-all font-mono"
                        />
                      </div>
                      <div className="p-6 bg-brand-orange/5 rounded-2xl border border-brand-orange/10">
                        <p className="text-[10px] text-brand-orange font-bold leading-relaxed tracking-wide">Optimization Insight: High-resolution vertical or landscape assets are recommended for hero positions. Media should align with organizational brand guidelines.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Executive Summary</label>
                  <textarea 
                    required
                    placeholder="Provide a concise briefing of the article content..."
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-brand-orange/30 transition-all min-h-[100px] leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Syntactical Content (Markdown)</label>
                    <div className="flex items-center gap-2">
                       <Eye className="w-3 h-3 text-brand-orange" />
                       <span className="text-[8px] font-black uppercase text-brand-orange">Rich Text Enabled</span>
                    </div>
                  </div>
                  <textarea 
                    required
                    placeholder="## Core Insights\n\nBegin drafting your specialized article content here. Use hierarchical markdown syntaxes for optimal distribution..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-[2rem] px-8 py-10 text-white text-base focus:outline-none focus:border-brand-orange/30 transition-all min-h-[400px] font-mono leading-loose no-scrollbar"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-6 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, status: 'draft'})}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.status === 'draft' ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-white"
                      )}
                    >
                      Draft Protocol
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, status: 'published'})}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.status === 'published' ? "bg-green-500/20 text-green-500 border border-green-500/30" : "text-gray-500 hover:text-white"
                      )}
                    >
                      Release Asset
                    </button>
                  </div>

                  <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={closeModal}
                      className="flex-1 sm:flex-none px-8 py-4 rounded-[1.5rem] bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Discard Changes
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting || uploading}
                      className="flex-1 sm:flex-none bg-brand-orange hover:bg-brand-orange-dark text-white px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl shadow-brand-orange/10 disabled:opacity-30"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>SYNCHRONIZING...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>COMMIT ARTICLE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
