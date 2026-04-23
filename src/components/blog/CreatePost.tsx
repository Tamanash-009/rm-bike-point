import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Image as ImageIcon, Send, X, Type, FileText, Tag as TagIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['Maintenance', 'Customization', 'Reviews', 'Events', 'Tips'];

export default function CreatePost() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Maintenance',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'blogPosts'), {
        ...form,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'R.M Admin',
        status: 'published',
        createdAt: serverTimestamp(),
        commentCount: 0,
        viewCount: 0
      });

      toast.success("Post published successfully!");
      setForm({
        title: '',
        excerpt: '',
        content: '',
        category: 'Maintenance',
        imageUrl: ''
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to publish post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-12">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-full p-8 bg-card-bg border border-white/10 rounded-[2.5rem] flex items-center justify-between group hover:border-brand-orange/50 transition-all shadow-xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center border border-brand-orange/20 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-brand-orange" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Draft a new post</h3>
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Share wisdom with the community</p>
              </div>
            </div>
            <div className="px-6 py-3 rounded-full border border-white/10 group-hover:border-brand-orange/40 text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-brand-orange transition-all">
              Compose Now
            </div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card-bg border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Visual glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center text-black">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">New Publication</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all border border-white/5 shadow-inner"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Title */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                       <Type className="w-3 h-3" />
                       Content Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter a compelling title..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold placeholder:text-white/20 focus:border-brand-orange/50 transition-all outline-none text-lg"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                       <TagIcon className="w-3 h-3" />
                       Classification
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold focus:border-brand-orange/50 transition-all outline-none appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0D0D0D] p-4 font-bold">{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                      <FileText className="w-3 h-3" />
                      Executive Summary (Excerpt)
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Short summary for the feed..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold placeholder:text-white/20 focus:border-brand-orange/50 transition-all outline-none resize-none"
                  />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                      <FileText className="w-3 h-3" />
                      Main Publication Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write the full story here..."
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white leading-relaxed placeholder:text-white/10 focus:border-brand-orange/50 transition-all outline-none resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">
                      <ImageIcon className="w-3 h-3" />
                      Cover Image Link
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white/60 font-mono text-sm placeholder:text-white/20 focus:border-brand-orange/50 transition-all outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-orange hover:text-white transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Publish to Feed'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
