import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Bike, Wrench, CheckCircle2, ChevronRight, ChevronLeft, Phone, Settings, Zap, ShieldCheck, Droplets, Hammer, Gauge } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import { getUserPoints, redeemPoints, LOYALTY_RULES } from '../services/loyaltyService';
import { useEffect } from 'react';
import ServiceCalendar from '../components/booking/ServiceCalendar';

export default function Booking() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!auth.currentUser) {
      toast.error("Please login to book a service");
      navigate('/auth', { state: { from: location } });
      return;
    }
    const unsub = getUserPoints(auth.currentUser.uid, setUserPoints);
    return () => unsub();
  }, [navigate, location]);

  const discountAmount = pointsToRedeem * LOYALTY_RULES.REDEMPTION_RATE;

  const [formData, setFormData] = useState({
    bikeModel: '',
    serviceType: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
    serviceInterval: '6' // Default 6 months
  });

  const serviceIntervals = [
    { label: '3 Months', value: '3', desc: 'Ideal for heavy usage' },
    { label: '6 Months', value: '6', desc: 'Standard maintenance' },
    { label: '12 Months', value: '12', desc: 'Low usage / Storage' },
    { label: 'No Reminders', value: '0', desc: 'Skip notifications' }
  ];

  const serviceTypes = [
    { id: "General Service", icon: Settings, description: "Complete checkup & maintenance" },
    { id: "Engine Tuning", icon: Zap, description: "Performance optimization" },
    { id: "Brake Overhaul", icon: ShieldCheck, description: "Safety & stopping power" },
    { id: "Oil Change", icon: Droplets, description: "Premium synthetic lubricants" },
    { id: "Washing & Polishing", icon: Droplets, description: "Deep clean & paint protection" },
    { id: "Major Repair", icon: Hammer, description: "Expert mechanical fixes" }
  ];

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      toast.error("Please login to book a service.");
      return;
    }

    setLoading(true);
    try {
      // Calculate next service date if an interval is selected
      let nextServiceDate = null;
      if (formData.serviceInterval !== '0') {
        const currentServiceDate = new Date(formData.date);
        const intervalMonths = parseInt(formData.serviceInterval);
        currentServiceDate.setMonth(currentServiceDate.getMonth() + intervalMonths);
        nextServiceDate = currentServiceDate.toISOString().split('T')[0];
      }

      const bookingData = {
        ...formData,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userEmail: auth.currentUser.email,
        status: 'pending',
        pointsRedeemed: pointsToRedeem,
        discountAmount: discountAmount,
        nextServiceDate,
        reminderSent: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      if (pointsToRedeem > 0) {
        await redeemPoints(auth.currentUser.uid, pointsToRedeem, discountAmount, `Service Discount: ${formData.serviceType}`);
      }

      toast.success("Booking submitted successfully!");
      setStep(4);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">BOOK A <span className="text-brand-orange">SERVICE</span></h1>
        <p className="text-gray-400">Schedule your motorcycle maintenance in a few easy steps.</p>
      </header>

      {/* Progress Bar */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500",
              step >= s ? "bg-brand-orange text-white" : "bg-gray-800 text-gray-500"
            )}
          >
            {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
          </div>
        ))}
      </div>

      <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <Bike className="w-4 h-4" />
                  <span>Bike Model</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Classic 350"
                  value={formData.bikeModel}
                  onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 12345 67890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <Wrench className="w-4 h-4" />
                  <span>Service Type</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {serviceTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, serviceType: type.id })}
                      className={cn(
                        "p-6 rounded-3xl text-left transition-all border flex items-start space-x-4 group relative overflow-hidden",
                        formData.serviceType === type.id 
                          ? "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/20" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-brand-orange/50 hover:bg-brand-orange/5"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        formData.serviceType === type.id ? "bg-white/20" : "bg-white/5 group-hover:bg-brand-orange/10"
                      )}>
                        <type.icon className={cn("w-6 h-6", formData.serviceType === type.id ? "text-white" : "text-brand-orange")} />
                      </div>
                      <div>
                        <div className="font-bold text-lg mb-1">{type.id}</div>
                        <div className={cn("text-xs", formData.serviceType === type.id ? "text-white/80" : "text-gray-500")}>
                          {type.description}
                        </div>
                      </div>
                      {formData.serviceType === type.id && (
                        <motion.div 
                          layoutId="active-service"
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <Clock className="w-4 h-4" />
                  <span>Next Service Reminder</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {serviceIntervals.map((interval) => (
                    <button
                      key={interval.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceInterval: interval.value })}
                      className={cn(
                        "p-4 rounded-2xl text-left transition-all border",
                        formData.serviceInterval === interval.value
                          ? "bg-brand-orange/10 border-brand-orange text-brand-orange"
                          : "bg-white/5 border-white/10 text-gray-500 hover:border-white/30"
                      )}
                    >
                      <div className="font-bold text-sm">{interval.label}</div>
                      <div className="text-[10px] opacity-60">{interval.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!formData.bikeModel || !formData.serviceType || !formData.phone}
                onClick={handleNext}
                className="w-full bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all"
              >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* Custom Calendar Integration */}
              <div className="space-y-6">
                <ServiceCalendar 
                  selectedDate={formData.date}
                  onDateSelect={(date) => setFormData({ ...formData, date })}
                />
              </div>

              <div className="space-y-6">
                <label className="flex items-center space-x-3 text-[10px] font-black text-white/30 uppercase tracking-[0.25em] ml-2">
                  <Clock className="w-4 h-4 text-brand-orange" />
                  <span>Workshop Slots</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setFormData({ ...formData, time: time })}
                      className={cn(
                        "py-5 px-2 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all border relative overflow-hidden group",
                        formData.time === time 
                          ? "bg-white text-black border-white shadow-xl" 
                          : "bg-white/5 border-white/5 text-white/40 hover:border-brand-orange/50 hover:bg-brand-orange/5"
                      )}
                    >
                      <span className="relative z-10">{time}</span>
                      {formData.time === time && (
                        <motion.div 
                          layoutId="active-time"
                          className="absolute inset-0 bg-white"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 transition-all border border-white/5 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>PREVIOUS</span>
                </button>
                <button
                  disabled={!formData.date || !formData.time}
                  onClick={handleNext}
                  className="flex-[2] bg-brand-orange hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 transition-all shadow-2xl shadow-brand-orange/20 active:scale-95 group"
                >
                  <span>REVIEW APPOINTMENT</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Review Details</h3>
                <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bike Model</span>
                    <span className="font-bold">{formData.bikeModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service Type</span>
                    <span className="font-bold">{formData.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone</span>
                    <span className="font-bold">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span className="font-bold">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time</span>
                    <span className="font-bold">{formData.time}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-500 pt-2 border-t border-white/5">
                      <span className="text-sm">Loyalty Discount</span>
                      <span className="font-bold">- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption */}
                {auth.currentUser && userPoints >= 100 && (
                  <div className="space-y-4 bg-brand-orange/5 p-6 rounded-2xl border border-brand-orange/20">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-brand-orange uppercase tracking-widest">Redeem Points</label>
                      <span className="text-xs text-gray-400">{userPoints} pts available</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={Math.min(userPoints, 5000)} // Cap redemption at 5000 points (₹500)
                      step="100"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{pointsToRedeem} points</span>
                      <span className="text-green-500 font-bold">- {formatPrice(discountAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Additional Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Any specific issues or requests?"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all border border-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-[2] bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all orange-glow"
                >
                  {loading ? "Submitting..." : "Confirm Booking"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-12"
            >
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
                <p className="text-gray-400">
                  Your service request has been received. Our team will contact you shortly to confirm the appointment.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200 transition-all"
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
