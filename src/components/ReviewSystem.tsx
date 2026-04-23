import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, User, Trash2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Review {
  id: string;
  targetId: string;
  targetType: 'product' | 'service' | 'bike';
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface ReviewSystemProps {
  targetId: string;
  targetType: 'product' | 'service' | 'bike';
}

export default function ReviewSystem({ targetId, targetType }: ReviewSystemProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(fetchedReviews);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetId, targetType]);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error("Please login to leave a review.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        targetId,
        targetType,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      setComment('');
      setRating(5);
      toast.success("Review submitted!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success("Review deleted.");
    } catch (error) {
      toast.error("Failed to delete review.");
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Reviews & Ratings</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-yellow-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={cn("w-5 h-5", s <= Number(averageRating) ? "fill-current" : "opacity-30")} 
                />
              ))}
            </div>
            <span className="text-2xl font-bold">{averageRating}</span>
            <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star 
                    className={cn(
                      "w-8 h-8 transition-colors", 
                      s <= rating ? "text-yellow-500 fill-current" : "text-gray-600"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-full font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting..." : (
              <>
                <span>Submit Review</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="glass p-8 rounded-3xl border border-white/10 text-center">
          <p className="text-gray-400">Please login to leave a review.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border border-white/10 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold">{review.userName}</h4>
                      <div className="flex items-center text-yellow-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn("w-3 h-3", s <= review.rating ? "fill-current" : "opacity-30")} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {auth.currentUser?.uid === review.userId && (
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                  {review.createdAt?.toDate().toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No reviews yet. Be the first to review!
          </div>
        )}
      </div>
    </div>
  );
}
