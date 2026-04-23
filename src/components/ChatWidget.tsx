import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Loader2, Phone, Trash2, Clock, Calendar, ArrowRight, ShoppingBag } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc, getDoc, deleteDoc, getDocs, writeBatch, where, limit } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useUIStore } from '../store/useUIStore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isAdmin: boolean;
  isAI?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: any;
  createdAt: any;
}

export default function ChatWidget() {
  const { isDrawerOpen, isModalOpen } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setIsOpen(false);
        setActiveSessionId(null);
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch sessions for history drawer
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession)));
    });
    return () => unsubscribe();
  }, [user]);

  // Handle first-time greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && user && activeSessionId) {
      const greeted = localStorage.getItem(`greeted_${user.uid}`);
      if (!greeted) {
        const greeting = "Hello! Welcome to R.M Bike Point 🚀 We provide premium motorcycle service, genuine spare parts, and performance upgrades. How can I assist you today?";
        addDoc(collection(db, 'chatSessions', activeSessionId, 'messages'), {
          senderId: 'ai-assistant',
          senderName: 'RM Assistant',
          text: greeting,
          createdAt: serverTimestamp(),
          isAdmin: true,
          isAI: true
        }).then(() => {
          localStorage.setItem(`greeted_${user.uid}`, 'true');
        });
      }
    }
  }, [isOpen, messages.length, user, activeSessionId]);

  // Fetch messages for active session
  useEffect(() => {
    if (!user || !activeSessionId || !isOpen) return;
    const q = query(
      collection(db, 'chatSessions', activeSessionId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsubscribe();
  }, [activeSessionId, user, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  const startNewSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        title: 'New Chat',
        lastMessage: 'Starting...',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setActiveSessionId(sessionRef.id);
      setShowHistory(false);
    } catch (error) {
      toast.error("Failed to start new chat");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;
    try {
      await deleteDoc(doc(db, 'chatSessions', id));
      if (activeSessionId === id) setActiveSessionId(null);
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const deleteAllHistory = async () => {
    if (!confirm("Delete ALL chat history? This cannot be undone.")) return;
    try {
      const batch = writeBatch(db);
      sessions.forEach(s => batch.delete(doc(db, 'chatSessions', s.id)));
      await batch.commit();
      setActiveSessionId(null);
      toast.success("All history cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      setLoading(true);
      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        title: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : ''),
        lastMessage: inputText,
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      targetSessionId = sessionRef.id;
      setActiveSessionId(targetSessionId);
    }

    const text = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      // Add user message
      await addDoc(collection(db, 'chatSessions', targetSessionId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'User',
        text,
        createdAt: serverTimestamp(),
        isAdmin: false
      });

      // Update session title if first message
      if (messages.length === 0) {
        await updateDoc(doc(db, 'chatSessions', targetSessionId), {
          title: text.substring(0, 30) + (text.length > 30 ? '...' : '')
        });
      }

      // Prepare history
      const historyItems = messages.map(m => ({
        role: m.isAdmin ? 'model' : 'user' as 'user' | 'model',
        parts: [{ text: m.text }]
      })).slice(-10);

      // Call Backend
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyItems })
      });

      const data = await res.json();
      const aiResponse = data.reply;

      // Add AI message
      await addDoc(collection(db, 'chatSessions', targetSessionId, 'messages'), {
        senderId: 'ai-assistant',
        senderName: 'RM Assistant',
        text: aiResponse,
        createdAt: serverTimestamp(),
        isAdmin: true,
        isAI: true
      });

      // Update session
      await updateDoc(doc(db, 'chatSessions', targetSessionId), {
        lastMessage: aiResponse.substring(0, 100),
        lastMessageAt: serverTimestamp(),
      });

    } catch (error) {
      toast.error("AI Assistant unavailable. Try WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const shopNowMatch = text.match(/\[SHOP_NOW:([^\]]+)\]/);
    if (shopNowMatch) {
      const cleanText = text.replace(/\[SHOP_NOW:[^\]]+\]/g, '');
      const productId = shopNowMatch[1];
      return (
        <div className="space-y-4">
          <p>{cleanText}</p>
          <Link 
            to={`/shop/${productId}`}
            className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all border border-white/10 group"
          >
            <ShoppingBag className="w-4 h-4 text-brand-orange" />
            <span className="font-bold text-xs uppercase">Shop Now</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      );
    }
    return <p>{text}</p>;
  };

  if (!auth.currentUser || isDrawerOpen || isModalOpen) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[115]"
            />
            
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[120] h-[85vh] glass rounded-t-[3rem] border-t border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-orange/10 backdrop-blur-md sticky top-0 z-[130]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black whitespace-nowrap tracking-tight">RM AI Assistant</h3>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    title="Chat History"
                    className={cn(
                      "p-3 rounded-full transition-all border",
                      showHistory ? "bg-brand-orange text-white border-brand-orange shadow-lg" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                    )}
                  >
                    <Clock className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Chat Content or History */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                {/* History Drawer */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div 
                      key="history"
                      initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                      transition={{ type: "tween" }}
                      className="absolute inset-x-0 inset-y-0 bg-[#0A0A0A]/95 backdrop-blur-xl z-[125] p-6 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-black tracking-tighter uppercase italic">Chat History</h4>
                        {sessions.length > 0 && (
                          <button onClick={deleteAllHistory} className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest border border-red-500/20 px-3 py-1 rounded-full">
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                        <button 
                          onClick={startNewSession}
                          className="w-full flex items-center justify-center space-x-3 p-5 rounded-2xl bg-brand-orange text-black font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform mb-4 shadow-xl shadow-brand-orange/20"
                        >
                          <Send className="w-5 h-5" />
                          <span>Start New Chat</span>
                        </button>

                        {sessions.length === 0 ? (
                          <div className="text-center py-20 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="font-bold">No sessions found</p>
                          </div>
                        ) : (
                          sessions.map(s => (
                            <div 
                              key={s.id}
                              onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                              className={cn(
                                "group p-5 rounded-[2rem] border transition-all cursor-pointer flex flex-col space-y-2",
                                activeSessionId === s.id ? "bg-white/10 border-brand-orange/50" : "bg-white/5 border-white/5 hover:border-white/20"
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <span className={cn("text-sm font-black line-clamp-1", activeSessionId === s.id ? "text-brand-orange" : "text-white")}>
                                  {s.title}
                                </span>
                                <button
                                  onClick={(e) => deleteSession(e, s.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1 italic">{s.lastMessage}</p>
                              <div className="flex items-center space-x-2 pt-2">
                                <Clock className="w-3 h-3 text-gray-600" />
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                  {s.lastMessageAt?.toDate ? new Date(s.lastMessageAt.toDate()).toLocaleDateString() : 'Just now'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
                  {!activeSessionId && sessions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <motion.div 
                        animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}
                        className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center border border-brand-orange/20"
                      >
                        <MessageCircle className="w-12 h-12 text-brand-orange" />
                      </motion.div>
                      <div>
                        <h4 className="text-3xl font-black mb-2 tracking-tighter">HI RIDER! 🏍️</h4>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">I'm your official RM Bike Point assistant. Ask me anything about services or spare parts!</p>
                      </div>
                      <button onClick={startNewSession} className="bg-brand-orange text-black px-10 py-4 rounded-full font-black uppercase tracking-tighter flex items-center gap-3">
                        Launch Chat <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: msg.isAdmin ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg.id || i}
                        className={cn("flex flex-col max-w-[85%]", msg.isAdmin ? "mr-auto" : "ml-auto items-end")}
                      >
                        <div className={cn("flex items-center space-x-2 mb-1", msg.isAdmin ? "flex-row" : "flex-row-reverse space-x-reverse")}>
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-primary/40">
                            {msg.senderName || (msg.isAdmin ? 'Assistant' : 'You')}
                          </span>
                        </div>
                        <div className={cn(
                          "px-6 py-4 rounded-[2rem] text-sm leading-relaxed",
                          msg.isAdmin 
                            ? "bg-white/5 border border-white/10 rounded-tl-none" 
                            : "bg-brand-orange text-white rounded-tr-none shadow-xl shadow-brand-orange/20"
                        )}>
                          {renderMessageContent(msg.text)}
                        </div>
                        <span className="text-[8px] text-gray-700 font-bold mt-1 px-2">
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                        </span>
                      </motion.div>
                    ))
                  )}
                  {loading && (
                    <div className="flex flex-col max-w-[85%] mr-auto">
                      <div className="bg-white/5 border border-white/10 rounded-[2rem] rounded-tl-none px-6 py-4 flex space-x-2 items-center w-24">
                        {[0, 0.2, 0.4].map(d => (
                          <motion.div key={d} animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: d }} className="w-2 h-2 bg-brand-orange rounded-full" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-black/80 backdrop-blur-3xl border-t border-white/5 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex items-center gap-3">
                  <div className="relative flex-grow">
                    <input
                      type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask about parts, prices, or service..."
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-8 pr-16 focus:outline-none focus:border-brand-orange/50 transition-all placeholder:text-white/20 text-md shadow-2xl"
                    />
                    <button 
                      type="submit" disabled={loading || !inputText.trim()}
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-orange text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                  <a 
                    href="https://wa.me/916289328280" target="_blank" rel="noopener noreferrer"
                    className="p-5 bg-[#25D366]/10 text-[#25D366] rounded-full border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-orange text-black rounded-full flex items-center justify-center relative shadow-3xl shadow-brand-orange/40 hover:orange-glow transition-all group"
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
      </motion.button>
    </div>
  );
}
