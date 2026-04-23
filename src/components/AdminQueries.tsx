import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { MessageSquare, Star, Trash2, Send, Phone, Clock, User as UserIcon, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';

interface Query {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isImportant: boolean;
  status: 'new' | 'replied' | 'closed';
  createdAt: any;
}

export default function AdminQueries() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Query)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'queries');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleImportant = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'queries', id), { isImportant: !current });
      toast.success("Updated priority");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const deleteQuery = async (id: string) => {
    if (!window.confirm("Delete this query?")) return;
    try {
      await deleteDoc(doc(db, 'queries', id));
      toast.success("Query deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleReply = (query: Query) => {
    const message = encodeURIComponent(`Hi ${query.name}, regarding your query: "${query.subject}". \n\nReply: ${replyText}`);
    const whatsappUrl = `https://wa.me/${query.phone}?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Update status in Firestore
    updateDoc(doc(db, 'queries', query.id), { status: 'replied' });
    
    setReplyText('');
    setSelectedQuery(null);
    toast.success("Reply sent via WhatsApp!");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-8 w-32 mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-2xl border border-white/5 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 opacity-50" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-1/2 opacity-50" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1 rounded-full" />
              <Skeleton className="h-12 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <span>INQUEST QUEUE</span>
          </h2>
          <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">{queries.length}</span>
        </div>
        
        <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
          {queries.map((q) => (
            <motion.div 
              layout
              key={q.id}
              onClick={() => setSelectedQuery(q)}
              className={cn(
                "p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 relative group overflow-hidden",
                selectedQuery?.id === q.id 
                  ? "bg-brand-orange/5 border-brand-orange/30 shadow-lg shadow-brand-orange/5" 
                  : "bg-[#1E1E1E] border-white/5 hover:border-white/20",
                q.isImportant && selectedQuery?.id !== q.id && "border-r-4 border-r-yellow-500/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  "font-bold text-sm tracking-tight transition-colors",
                  selectedQuery?.id === q.id ? "text-brand-orange" : "text-white"
                )}>{q.name}</span>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                  q.status === 'new' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500"
                )}>{q.status}</span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">{q.subject}</p>
              
              {selectedQuery?.id === q.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange"
                />
              )}
            </motion.div>
          ))}
          {queries.length === 0 && (
            <div className="text-center py-24 bg-[#1E1E1E] rounded-[2rem] border border-white/5 border-dashed">
              <MessageSquare className="w-10 h-10 mx-auto mb-4 text-white/5" />
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No active inquiries</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedQuery ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1E1E1E] p-4 lg:p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -top-48 -right-48 w-96 h-96 bg-brand-orange/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-2 text-brand-orange mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedQuery.createdAt?.toDate ? selectedQuery.createdAt.toDate().toLocaleString() : 'Just now'}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight mb-4 leading-tight">{selectedQuery.subject}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-300">{selectedQuery.name}</span>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-300">{selectedQuery.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleImportant(selectedQuery.id, selectedQuery.isImportant)}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      selectedQuery.isImportant ? "bg-yellow-500/20 text-yellow-500" : "bg-white/5 text-gray-500 hover:bg-white/10"
                    )}
                  >
                    <Star className={cn("w-5 h-5", selectedQuery.isImportant && "fill-current")} />
                  </button>
                  <button 
                    onClick={() => deleteQuery(selectedQuery.id)}
                    className="w-12 h-12 bg-white/5 text-gray-500 hover:bg-red-500/20 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-white/2 p-8 lg:p-10 rounded-[2rem] border border-white/5 text-gray-400 text-base leading-loose mb-12 whitespace-pre-line">
                {selectedQuery.message}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-4 bg-brand-orange rounded-full" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-white/50">Communication Interface</span>
                </div>
                
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Draft your response here..."
                  className="w-full bg-white/2 border border-white/5 rounded-[1.5rem] p-6 text-white text-sm focus:outline-none focus:border-brand-orange/30 transition-all min-h-[160px] resize-none"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleReply(selectedQuery)}
                    className="group bg-[#25D366]/10 hover:bg-[#25D366] border border-[#25D366]/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-[#25D366] hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#25D366]/20"
                  >
                    <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Initiate WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => {
                      window.location.href = `mailto:${selectedQuery.email}?subject=Re: ${selectedQuery.subject}&body=${replyText}`;
                      updateDoc(doc(db, 'queries', selectedQuery.id), { status: 'replied' });
                    }}
                    className="group bg-brand-orange/10 hover:bg-brand-orange border border-brand-orange/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-brand-orange hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-brand-orange/20"
                  >
                    <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Transmit via Email</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-[#1E1E1E] rounded-[3rem] border border-white/5 border-dashed text-gray-600 transition-all">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Selection</p>
          </div>
        )}
      </div>
    </div>
  );
}
