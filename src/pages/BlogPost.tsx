import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Calendar, User, Tag, ArrowLeft, MessageSquare, Send, Trash2, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: string;
  imageUrl: string;
  createdAt: any;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'blogPosts', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
        } else {
          toast.error("Post not found");
          navigate('/blog');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `blogPosts/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Subscribe to comments
    const q = query(
      collection(db, 'blogPosts', id, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(fetchedComments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `blogPosts/${id}/comments`);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("Please login to comment");
      return;
    }
    if (!newComment.trim() || !id) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'blogPosts', id, 'comments'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
      toast.success("Comment added!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `blogPosts/${id}/comments`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', id, 'comments', commentId));
      toast.success("Comment deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blogPosts/${id}/comments/${commentId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/blog"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-orange transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Blog
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2rem] border border-white/10 overflow-hidden mb-12"
        >
          <div className="relative h-[400px]">
            <img 
              src={post.imageUrl || `https://picsum.photos/seed/${post.id}/1200/800`}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 font-medium">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <Calendar className="w-4 h-4 text-brand-orange" />
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                </div>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <User className="w-4 h-4 text-brand-orange" />
                  <span className="text-white font-bold">{post.authorName}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <MessageSquare className="w-4 h-4 text-brand-orange" />
                  {comments.length} Comments
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="prose prose-invert prose-orange max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <section className="glass rounded-[2rem] border border-white/10 p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-brand-orange" />
            Discussion ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="mb-12">
            {auth.currentUser ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`}
                    alt="User"
                    className="w-10 h-10 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:border-brand-orange/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="glass-button px-8 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400 mb-4">Please login to join the discussion.</p>
                <Link 
                  to="/profile" 
                  className="text-brand-orange font-bold hover:underline"
                >
                  Login or Sign Up
                </Link>
              </div>
            )}
          </form>

          {/* Comments List */}
          <div className="space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img 
                  src={comment.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`}
                  alt={comment.userName}
                  className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-sm block">{comment.userName}</span>
                      <span className="text-[10px] text-gray-500 uppercase">
                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    {(auth.currentUser?.uid === comment.userId || auth.currentUser?.email === 'chakrabortytamanash@gmail.com') && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500 italic">
                No comments yet. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
