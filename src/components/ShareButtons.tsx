import React from 'react';
import { Facebook, Link2, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface ShareButtonsProps {
  title: string;
  url: string;
  className?: string;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

export default function ShareButtons({ title, url, className }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-green-500/20 hover:text-green-500',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-blue-600/20 hover:text-blue-600',
    },
    {
      name: 'X',
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'hover:bg-white/10 hover:text-white',
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Share:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "p-2 rounded-xl bg-white/5 text-gray-400 transition-all duration-300 border border-white/10",
            link.color
          )}
          title={`Share on ${link.name}`}
        >
          <link.icon className="w-5 h-5" />
        </a>
      ))}
      <button
        onClick={copyToClipboard}
        className="p-2 rounded-xl bg-white/5 text-gray-400 transition-all duration-300 border border-white/10 hover:bg-brand-orange/20 hover:text-brand-orange"
        title="Copy Link"
      >
        <Link2 className="w-5 h-5" />
      </button>
    </div>
  );
}
