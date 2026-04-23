import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, addDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { MessageCircle, Send, User, Search, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: number;
  status: 'active' | 'closed';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  isAdmin: boolean;
  isAI?: boolean;
}

export default function AdminChat() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const q = query(
      collection(db, 'chatRooms'),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
      setRooms(fetchedRooms);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chatRooms');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const q = query(
      collection(db, 'chatRooms', selectedRoom.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chatRooms/${selectedRoom.id}/messages`);
    });

    return () => unsubscribe();
  }, [selectedRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom || !auth.currentUser) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await addDoc(collection(db, 'chatRooms', selectedRoom.id, 'messages'), {
        senderId: auth.currentUser.uid,
        senderName: 'Admin',
        text,
        createdAt: serverTimestamp(),
        isAdmin: true
      });

      await updateDoc(doc(db, 'chatRooms', selectedRoom.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom || !window.confirm(`Delete entire chat room for ${selectedRoom.userName}?`)) return;

    try {
      const messagesRef = collection(db, 'chatRooms', selectedRoom.id, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      await deleteDoc(doc(db, 'chatRooms', selectedRoom.id));
      
      setSelectedRoom(null);
      setMessages([]);
      toast.success("Chat room deleted");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  if (loading) return <div className="p-24 text-center">Loading chats...</div>;

  return (
    <div className="glass rounded-[3rem] border border-white/10 overflow-hidden h-[700px] flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold mb-4">Support Chats</h2>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {rooms.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No active chats</div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={cn(
                  "w-full p-6 flex items-center space-x-4 transition-all border-b border-white/5",
                  selectedRoom?.id === room.id ? "bg-brand-orange/10 border-r-4 border-r-brand-orange" : "hover:bg-white/5"
                )}
              >
                <div className="relative">
                  {room.userPhoto ? (
                    <img src={room.userPhoto} className="w-12 h-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {room.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm truncate">{room.userName}</div>
                  <div className="text-xs text-gray-500 truncate">{room.lastMessage}</div>
                </div>
                <div className="text-[10px] text-gray-600 uppercase font-bold">
                  {room.lastMessageAt?.toDate ? room.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/20">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-4">
                {selectedRoom.userPhoto ? (
                  <img src={selectedRoom.userPhoto} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{selectedRoom.userName}</h3>
                  <span className="text-[10px] text-brand-orange uppercase font-bold tracking-widest">Active Session</span>
                </div>
              </div>
              <button 
                onClick={handleDeleteRoom}
                className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                title="Delete Chat History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    msg.isAdmin ? "ml-auto items-end" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "flex items-center space-x-2 mb-1.5",
                    msg.isAdmin ? "flex-row-reverse space-x-reverse" : "flex-row"
                  )}>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/30">
                      {msg.isAdmin ? 'You (Admin)' : (msg.senderName || 'Customer')}
                    </span>
                    {msg.isAI && (
                      <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-500/20 uppercase">
                        AI
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-xl border border-white/5",
                    msg.isAdmin 
                      ? "bg-brand-orange text-white rounded-tr-none" 
                      : "bg-white/5 rounded-tl-none backdrop-blur-md"
                  )}>
                    {msg.text}
                  </div>
                  <div className={cn(
                    "flex items-center mt-1.5 px-1 opacity-50",
                    msg.isAdmin ? "justify-end" : "justify-start"
                  )}>
                    <span className="text-[9px] font-bold tracking-tight">
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-8 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-16 focus:outline-none focus:border-brand-orange transition-colors"
                />
                <button 
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="absolute right-3 top-3 p-3 bg-brand-orange text-white rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
            <MessageCircle className="w-24 h-24 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Select a chat</h3>
            <p>Choose a user from the sidebar to start responding to support requests.</p>
          </div>
        )}
      </div>
    </div>
  );
}
