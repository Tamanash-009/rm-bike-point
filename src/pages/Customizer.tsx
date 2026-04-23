import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Check, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BASE_BIKES = [
  {
    id: 'base-re-classic',
    name: 'Royal Enfield Classic 350',
    price: 190000,
    imageUrl: 'https://picsum.photos/seed/reclassic/800/600',
    description: 'A timeless classic with modern reliability.',
  },
  {
    id: 'base-ktm-duke',
    name: 'KTM Duke 390',
    price: 290000,
    imageUrl: 'https://picsum.photos/seed/ktmduke/800/600',
    description: 'The corner rocket. Aggressive and powerful.',
  },
  {
    id: 'base-yamaha-mt15',
    name: 'Yamaha MT-15',
    price: 160000,
    imageUrl: 'https://picsum.photos/seed/yamahamt/800/600',
    description: 'The dark warrior. Agile and street-smart.',
  },
];

const CUSTOMIZATION_OPTIONS = {
  exhaust: [
    { id: 'ex-stock', name: 'Stock Exhaust', price: 0, imageUrl: 'https://picsum.photos/seed/exstock/200/200' },
    { id: 'ex-akra', name: 'Akrapovic Slip-on', price: 15000, imageUrl: 'https://picsum.photos/seed/exakra/200/200' },
    { id: 'ex-sc', name: 'SC Project', price: 12000, imageUrl: 'https://picsum.photos/seed/exsc/200/200' },
  ],
  seat: [
    { id: 'st-stock', name: 'Stock Seat', price: 0, imageUrl: 'https://picsum.photos/seed/ststock/200/200' },
    { id: 'st-tour', name: 'Touring Seat', price: 3500, imageUrl: 'https://picsum.photos/seed/sttour/200/200' },
    { id: 'st-cafe', name: 'Cafe Racer Cowl', price: 4000, imageUrl: 'https://picsum.photos/seed/stcafe/200/200' },
  ],
  handlebar: [
    { id: 'hb-stock', name: 'Stock Handlebar', price: 0, imageUrl: 'https://picsum.photos/seed/hbstock/200/200' },
    { id: 'hb-clip', name: 'Clip-on Bars', price: 2500, imageUrl: 'https://picsum.photos/seed/hbclip/200/200' },
    { id: 'hb-ape', name: 'Ape Hangers', price: 3000, imageUrl: 'https://picsum.photos/seed/hbape/200/200' },
  ],
  paint: [
    { id: 'pt-stock', name: 'Factory Paint', price: 0, color: '#ffffff' },
    { id: 'pt-matte', name: 'Matte Black', price: 5000, color: '#1a1a1a' },
    { id: 'pt-custom', name: 'Custom Graphic', price: 8000, color: '#ff4500' },
  ],
};

type Category = keyof typeof CUSTOMIZATION_OPTIONS;

export default function Customizer() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBike, setSelectedBike] = useState<typeof BASE_BIKES[0] | null>(null);
  const [selections, setSelections] = useState<Record<Category, any>>({
    exhaust: CUSTOMIZATION_OPTIONS.exhaust[0],
    seat: CUSTOMIZATION_OPTIONS.seat[0],
    handlebar: CUSTOMIZATION_OPTIONS.handlebar[0],
    paint: CUSTOMIZATION_OPTIONS.paint[0],
  });
  const [activeTab, setActiveTab] = useState<Category>('exhaust');

  const addToCart = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const handleSelectBike = (bike: typeof BASE_BIKES[0]) => {
    setSelectedBike(bike);
    setStep(2);
  };

  const handleSelectOption = (category: Category, option: any) => {
    setSelections((prev) => ({ ...prev, [category]: option }));
  };

  const calculateTotal = () => {
    if (!selectedBike) return 0;
    let total = selectedBike.price;
    Object.values(selections).forEach((opt: any) => {
      total += opt.price;
    });
    return total;
  };

  const handleAddToCart = () => {
    if (!selectedBike) return;

    const modifications = Object.values(selections)
      .filter((opt: any) => opt.price > 0)
      .map((opt: any) => opt.name)
      .join(', ');

    const customName = modifications 
      ? `Custom ${selectedBike.name} w/ ${modifications}`
      : selectedBike.name;

    addToCart({
      id: `custom-${selectedBike.id}-${Date.now()}`,
      name: customName,
      price: calculateTotal(),
      quantity: 1,
      imageUrl: selectedBike.imageUrl,
    });

    toast.success('Custom bike added to cart!');
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange mb-6">
          <Settings className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          BUILD YOUR <span className="text-brand-orange">DREAM RIDE</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Select a base model and customize it with premium parts to create a motorcycle that's uniquely yours.
        </p>
      </header>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Step 1: Choose Your Base Bike</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BASE_BIKES.map((bike) => (
              <div
                key={bike.id}
                onClick={() => handleSelectBike(bike)}
                className="glass rounded-[2.5rem] overflow-hidden cursor-pointer group border border-white/10 hover:border-brand-orange transition-all"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={bike.imageUrl}
                    alt={bike.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-brand-orange font-bold flex items-center space-x-2">
                      <span>Select Base</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{bike.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{bike.description}</p>
                  <div className="text-2xl font-black text-brand-orange">{formatPrice(bike.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {step === 2 && selectedBike && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Customization Options */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center space-x-4 mb-8">
              <button
                onClick={() => setStep(1)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">Step 2: Customize Parts</h2>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto no-scrollbar space-x-4 pb-2">
              {(Object.keys(CUSTOMIZATION_OPTIONS) as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs whitespace-nowrap transition-all",
                    activeTab === cat
                      ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {CUSTOMIZATION_OPTIONS[activeTab].map((option) => {
                const isSelected = selections[activeTab].id === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectOption(activeTab, option)}
                    className={cn(
                      "glass rounded-3xl p-4 cursor-pointer transition-all border-2",
                      isSelected ? "border-brand-orange bg-brand-orange/5" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    {activeTab === 'paint' ? (
                      <div 
                        className="w-full aspect-video rounded-2xl mb-4 border border-white/10"
                        style={{ backgroundColor: option.color }}
                      />
                    ) : (
                      <div className="w-full aspect-video rounded-2xl mb-4 overflow-hidden bg-black/50">
                        <img 
                          src={option.imageUrl} 
                          alt={option.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm">{option.name}</h4>
                        <div className="text-brand-orange font-black text-sm mt-1">
                          {option.price === 0 ? 'Included' : `+${formatPrice(option.price)}`}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-orange flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-[2.5rem] p-8 border border-white/10 sticky top-24">
              <h3 className="text-xl font-bold mb-6">Build Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-start pb-4 border-b border-white/5">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Base Bike</div>
                    <div className="font-bold">{selectedBike.name}</div>
                  </div>
                  <div className="font-bold">{formatPrice(selectedBike.price)}</div>
                </div>

                {(Object.entries(selections) as [Category, any][]).map(([cat, opt]) => (
                  <div key={cat} className="flex justify-between items-start pb-4 border-b border-white/5">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">{cat}</div>
                      <div className="font-medium text-sm">{opt.name}</div>
                    </div>
                    <div className="text-sm font-bold text-brand-orange">
                      {opt.price === 0 ? '--' : `+${formatPrice(opt.price)}`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end mb-8">
                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Total Estimated</div>
                <div className="text-3xl font-black text-brand-orange">{formatPrice(calculateTotal())}</div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full glass-button bg-brand-orange hover:bg-brand-orange-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
