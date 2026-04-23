export interface ServiceItem {
  id: string;
  name: string;
  price: string;
  desc: string;
  time: string;
  category?: string;
}

export const SERVICE_CATEGORIES = [
  {
    title: "General Maintenance",
    services: [
      { id: "gen-1", name: "Full General Service", price: "₹999", time: "4-6 Hours", desc: "Oil change, filter cleaning, brake check, chain lubing, and washing." },
      { id: "gen-2", name: "Oil Change", price: "₹199", time: "30-45 Mins", desc: "Engine oil replacement (oil cost extra)." },
      { id: "gen-3", name: "Washing & Polishing", price: "₹299", time: "1-2 Hours", desc: "Deep cleaning and premium wax polish." },
      { id: "gen-4", name: "Chain Maintenance", price: "₹149", time: "20-30 Mins", desc: "Chain cleaning, tightening, and lubing." },
    ]
  },
  {
    title: "Engine & Performance",
    services: [
      { id: "eng-1", name: "Engine Tuning", price: "₹499", time: "1-2 Hours", desc: "Carburetor/FI cleaning and idle adjustment." },
      { id: "eng-2", name: "Valve Adjustment", price: "₹799", time: "2-3 Hours", desc: "Precision valve clearance setting." },
      { id: "eng-3", name: "Clutch Overhaul", price: "₹1,299", time: "3-4 Hours", desc: "Clutch plate replacement and cable adjustment." },
      { id: "eng-4", name: "Engine Decarbonizing", price: "₹1,499", time: "2-3 Hours", desc: "Removal of carbon deposits for better mileage." },
    ]
  },
  {
    title: "Brakes & Suspension",
    services: [
      { id: "brk-1", name: "Brake Pad Replacement", price: "₹199", time: "30 Mins", desc: "Front/Rear brake pad fitting." },
      { id: "brk-2", name: "Brake Bleeding", price: "₹299", time: "45 Mins", desc: "Hydraulic fluid replacement and air removal." },
      { id: "brk-3", name: "Fork Oil Change", price: "₹899", time: "3-4 Hours", desc: "Front suspension oil and seal replacement." },
      { id: "brk-4", name: "Rear Shock Service", price: "₹1,199", time: "2-3 Hours", desc: "Rear suspension maintenance and adjustment." },
    ]
  }
];

export const ALL_SERVICES = SERVICE_CATEGORIES.flatMap(cat => 
  cat.services.map(s => ({ ...s, category: cat.title }))
);
