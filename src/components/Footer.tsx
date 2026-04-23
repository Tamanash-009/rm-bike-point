import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, MapPin, Phone, Mail, Clock, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-32 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-white">
              R.M <motion.span 
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(255, 102, 0, 0)",
                    "0 0 10px rgba(255, 102, 0, 0.5)",
                    "0 0 0px rgba(255, 102, 0, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-brand-orange"
              >
                BIKE POINT
              </motion.span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium motorcycle service and spare parts. We provide top-notch maintenance for all types of bikes, from commuters to superbikes.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Services</Link></li>
              <li><Link to="/shop" className="hover:text-brand-orange transition-colors">Spare Parts</Link></li>
              <li><Link to="/bikes" className="hover:text-brand-orange transition-colors">Used Bikes</Link></li>
              <li><Link to="/blog" className="hover:text-brand-orange transition-colors">Blog</Link></li>
              <li><Link to="/booking" className="hover:text-brand-orange transition-colors">Book a Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
                <span>BIKE POINT Jhosser Road, Dighar More Near Bamongachi Choumatha, Opp Road King Showroom, Barasat, Kolkata, West Bengal 700125</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-brand-orange shrink-0" />
                <div className="flex flex-col">
                  <a href="https://wa.me/916289328280" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">+91 62893 28280</a>
                  <a href="tel:+919123016354" className="hover:text-brand-orange transition-colors">+91 91230 16354</a>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-brand-orange shrink-0" />
                <a href="mailto:rishistark009@gmail.com" className="hover:text-brand-orange transition-colors">rishistark009@gmail.com</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-orange" />
              Opening Hours
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="font-medium text-white/60">Mon - Sat</span>
                <span className="font-bold text-brand-orange">9:00 AM - 8:00 PM</span>
              </li>
              <li className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="font-medium text-white/60">Sunday</span>
                <span className="font-bold text-brand-orange">10:00 AM - 4:00 PM</span>
              </li>
              <li className="mt-4 p-3 bg-brand-orange/5 border border-brand-orange/10 rounded-xl text-center">
                <p className="text-[10px] font-black uppercase text-brand-orange tracking-widest animate-pulse">Open Now</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Image Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { seed: 'bike1', title: 'Workshop' },
            { seed: 'ktm', title: 'Service' },
            { seed: 'engine', title: 'Customs' },
            { seed: 'helmet', title: 'Gear' },
            { seed: 'rider', title: 'Community' },
            { seed: 'garage', title: 'Detailing' }
          ].map((img, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group"
            >
              <img 
                src={`https://picsum.photos/seed/${img.seed}/400/400`} 
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange">{img.title}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-gray-500 text-xs">
            <p>&copy; {new Date().getFullYear()} R.M Bike Point. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">UPI</span>
              <div className="w-10 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black text-white italic">UPI</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">Visa</span>
              <div className="w-10 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black text-white">VISA</div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">Razorpay</span>
              <div className="w-12 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black text-white">RAZORPAY</div>
            </div>
          </div>

          <div className="flex space-x-6">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-orange transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
