import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Info, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReviewSystem from '../components/ReviewSystem';
import { AnimatePresence } from 'motion/react';
import { SERVICE_CATEGORIES, ServiceItem } from '../constants/servicesData';

export default function Services() {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const serviceCategories = SERVICE_CATEGORIES;

  const ccPricing = [
    { range: "100cc - 150cc", general: "₹999", premium: "₹1,499" },
    { range: "160cc - 250cc", general: "₹1,299", premium: "₹1,899" },
    { range: "300cc - 500cc", general: "₹1,999", premium: "₹2,999" },
    { range: "600cc+", general: "₹3,499", premium: "₹5,499" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      <header className="text-center max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold tracking-tight mb-6"
        >
          SERVICE <span className="text-brand-orange">MENU</span>
        </motion.h1>
        <p className="text-gray-400 text-lg">
          Transparent pricing and expert care for every motorcycle. Choose from our specialized services or a complete maintenance package.
        </p>
      </header>

      {/* CC Pricing Table */}
      <section>
        <div className="flex items-center space-x-3 mb-8">
          <Info className="w-6 h-6 text-brand-orange" />
          <h2 className="text-2xl font-bold">Pricing by CC Range</h2>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 glass">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-6 font-bold text-gray-300">Engine Capacity</th>
                <th className="p-6 font-bold text-gray-300">General Service</th>
                <th className="p-6 font-bold text-gray-300">Premium Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ccPricing.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 font-medium">{row.range}</td>
                  <td className="p-6 text-gray-400">{row.general}</td>
                  <td className="p-6 text-brand-orange font-bold">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {serviceCategories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-bold border-l-4 border-brand-orange pl-4">{cat.title}</h2>
            <div className="space-y-6">
              {cat.services.map((s, j) => (
                <div 
                  key={j} 
                  className="group cursor-pointer hover:bg-white/5 p-4 -m-4 rounded-2xl transition-colors"
                  onClick={() => setSelectedService(s)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold group-hover:text-brand-orange transition-colors">{s.name}</h3>
                    <div className="text-right">
                      <div className="text-brand-orange font-bold">{s.price}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{s.time}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                  <Link 
                    to="/booking" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-orange hover:gap-3 transition-all uppercase tracking-widest"
                  >
                    Book Now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Service Details Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-12 no-scrollbar"
            >
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">{selectedService.name}</h2>
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Price Estimate</div>
                      <p className="text-brand-orange font-bold text-2xl">{selectedService.price}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Time Required</div>
                      <p className="text-white font-bold text-2xl">{selectedService.time}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 leading-relaxed text-lg">{selectedService.desc}</p>
                </div>

                <div className="flex gap-4">
                  <Link
                    to="/booking"
                    className="flex-1 bg-brand-orange hover:bg-brand-orange-dark text-white py-4 rounded-full font-bold text-center transition-all hover:scale-105"
                  >
                    Book This Service
                  </Link>
                </div>

                <div className="h-px bg-white/10" />

                <ReviewSystem targetId={selectedService.id} targetType="service" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="text-center bg-white/5 rounded-[3rem] p-12 border border-white/10">
        <h2 className="text-3xl font-bold mb-6">Need a Custom Quote?</h2>
        <p className="text-gray-400 mb-10 max-w-xl mx-auto">
          For major repairs, engine rebuilds, or custom modifications, please contact us or visit our workshop for a detailed inspection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/booking"
            className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
          >
            Book Appointment
          </Link>
          <Link
            to="/contact"
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all border border-white/10"
          >
            Contact Mechanics
          </Link>
        </div>
      </section>
    </div>
  );
}
