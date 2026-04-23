import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.phone);

    if (!isEmailValid || !isPhoneValid) {
      setErrors({
        email: isEmailValid ? '' : 'Invalid email address',
        phone: isPhoneValid ? '' : 'Invalid phone number (min 10 digits)'
      });
      toast.error("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'queries'), {
        ...formData,
        status: 'new',
        isImportant: false,
        createdAt: serverTimestamp()
      });
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setErrors({ email: '', phone: '' });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time validation
    if (name === 'email') {
      setErrors(prev => ({ 
        ...prev, 
        email: value && !validateEmail(value) ? 'Invalid email format' : '' 
      }));
    }
    if (name === 'phone') {
      setErrors(prev => ({ 
        ...prev, 
        phone: value && !validatePhone(value) ? 'Invalid phone format' : '' 
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-6">GET IN <span className="text-brand-orange">TOUCH</span></h1>
        <p className="text-gray-400 max-w-2xl">Have questions about our services or parts? Reach out to us anytime.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Info */}
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl border border-white/10">
              <Phone className="w-8 h-8 text-brand-orange mb-6" />
              <h3 className="font-bold mb-2">Call Us</h3>
              <p className="text-gray-400 text-sm">+91 62893 28280</p>
              <p className="text-gray-400 text-sm">+91 91230 16354</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/10">
              <Mail className="w-8 h-8 text-brand-orange mb-6" />
              <h3 className="font-bold mb-2">Email Us</h3>
              <p className="text-gray-400 text-sm">rishistark009@gmail.com</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/10">
              <MapPin className="w-8 h-8 text-brand-orange mb-6" />
              <h3 className="font-bold mb-2">Visit Us</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                BIKE POINT Jhosser Road, Dighar More Near Bamongachi Choumatha, Opp Road King Showroom, Barasat, Kolkata, West Bengal 700125
              </p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/10">
              <Clock className="w-8 h-8 text-brand-orange mb-6" />
              <h3 className="font-bold mb-2">Working Hours</h3>
              <p className="text-gray-400 text-sm">Mon-Sat: 9am - 8pm</p>
              <p className="text-gray-400 text-sm">Sun: 10am - 4pm</p>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="rounded-[3rem] overflow-hidden h-80 border border-white/10 relative">
            <img
              src="https://picsum.photos/seed/map/1200/600"
              alt="Map"
              className="w-full h-full object-cover opacity-50 grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-brand-orange" />
                <span className="font-bold">View on Google Maps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass p-12 rounded-[3rem] border border-white/10">
          <h2 className="text-3xl font-bold mb-8">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between px-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                  {errors.email && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.email}</span>}
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white/5 border rounded-2xl py-4 px-6 focus:outline-none transition-colors ${
                    errors.email ? 'border-red-500/50' : 'border-white/10 focus:border-brand-orange'
                  }`}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between px-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                  {errors.phone && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.phone}</span>}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white/5 border rounded-2xl py-4 px-6 focus:outline-none transition-colors ${
                    errors.phone ? 'border-red-500/50' : 'border-white/10 focus:border-brand-orange'
                  }`}
                  placeholder="+91 12345 67890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                  placeholder="How can we help?"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-4">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:scale-105 orange-glow disabled:opacity-50"
            >
              <span>{loading ? 'Sending...' : 'Send Message'}</span>
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
