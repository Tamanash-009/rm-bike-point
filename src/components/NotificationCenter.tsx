import React, { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { Bell, Check, Trash2, Clock, Package, Calendar, Info, X, Star, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'service' | 'order' | 'system';
  status: 'unread' | 'read';
  isFavorite?: boolean;
  link?: string;
  createdAt: any;
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      // Play sound if new unread notification arrives
      if (prevCountRef.current < newNotifications.length) {
        const hasNewUnread = newNotifications.some(n => 
          n.status === 'unread' && 
          !notifications.some(oldN => oldN.id === n.id)
        );
        if (hasNewUnread && audioRef.current) {
          audioRef.current.play().catch(e => console.log("Sound play blocked or failed:", e));
        }
      }
      
      setNotifications(newNotifications);
      prevCountRef.current = newNotifications.length;
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [notifications.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: 'read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const toggleFavorite = async (id: string, currentStatus?: boolean) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isFavorite: !currentStatus });
      toast.success(!currentStatus ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.status === 'unread');
    try {
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { status: 'read' })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'service': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'order': return <Package className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-brand-orange" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-primary/60 hover:text-brand-orange transition-colors"
      >
        <motion.div
          animate={unreadCount > 0 ? {
            rotate: [0, -10, 10, -10, 10, 0],
          } : {}}
          transition={{
            repeat: Infinity,
            duration: 2,
            repeatDelay: 3
          }}
        >
          <Bell className="w-6 h-6" />
        </motion.div>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-orange rounded-full neon-glow border-2 border-bg-primary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-80 sm:w-96 glass rounded-3xl border border-text-primary/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-text-primary/5 flex items-center justify-between bg-card-bg/50">
              <h3 className="font-bold flex items-center gap-2">
                Notifications
                {unreadCount > 0 && <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} new</span>}
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-orange hover:text-brand-orange-dark transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center opacity-50 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs uppercase font-bold tracking-widest text-gray-500">Syncing updates...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-text-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-text-primary/10" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No alerts for you yet</p>
                </div>
              ) : (
                <div className="divide-y divide-text-primary/5">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "p-5 transition-all relative group",
                        notification.status === 'unread' ? "bg-brand-orange/5" : "hover:bg-text-primary/5"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            notification.status === 'unread' ? "bg-brand-orange/10" : "bg-text-primary/5"
                          )}>
                            {getIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={cn(
                              "text-sm font-bold truncate pr-6",
                              notification.status === 'unread' ? "text-text-primary" : "text-text-primary/60"
                            )}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                              <button 
                                onClick={() => toggleFavorite(notification.id, notification.isFavorite)}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  notification.isFavorite ? "text-brand-orange bg-brand-orange/10" : "text-gray-500 hover:text-brand-orange hover:bg-brand-orange/10"
                                )}
                                title={notification.isFavorite ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={cn("w-3.5 h-3.5", notification.isFavorite && "fill-current")} />
                              </button>
                              {notification.status === 'unread' && (
                                <button 
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className={cn(
                            "text-xs mb-3 leading-relaxed line-clamp-2",
                            notification.status === 'unread' ? "text-text-primary/80" : "text-text-primary/40"
                          )}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1.5 bg-text-primary/5 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3" />
                              {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </span>
                            {notification.link && (
                              <Link 
                                to={notification.link}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="text-[10px] font-bold text-brand-orange hover:text-brand-orange-dark transition-colors flex items-center gap-1 group/link"
                              >
                                <span>Action Required</span>
                                <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-4 bg-card-bg/50 border-t border-text-primary/5">
                <Link 
                  to="/profile" 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 bg-text-primary/5 hover:bg-text-primary/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-primary/60 flex items-center justify-center gap-2 transition-all"
                >
                  View All Activity
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
