import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, Upload, Package, Bike } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { BIKE_BRANDS, ALL_MODELS, SPARE_PART_CATEGORIES } from '../constants/bikeData';
import { Skeleton, ProductSkeleton } from './Skeleton';
import * as xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const generateSlug = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

interface Listing {
  id: string;
  name?: string;
  model?: string;
  brand?: string;
  description: string;
  price: number;
  category?: string;
  imageUrl: string;
  images?: string[];
  type: 'product' | 'bike';
  stock?: number;
  kms?: number;
  year?: number;
  status?: string;
  bikeModels?: string[];
  make?: string;
  engineCc?: number;
  transmission?: 'Manual' | 'Automatic';
  color?: string;
  vin?: string;
  maintenanceHistory?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function AdminListings() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'bike' | 'product'>('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Listing>>({
    type: 'product',
    category: 'Accessories',
    status: 'available',
    images: [],
    transmission: 'Manual'
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    const toastId = toast.loading('Reading Excel file...');
    
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(worksheet);
      
      const { getSupabase } = await import('../lib/firebase');
      const sb = await getSupabase();
      let products = [];
      const seen = new Set();
      
      for (const row of rawData as any[]) {
        const getVal = (possibleKeys: string[]) => {
          for (const k of possibleKeys) {
            for (const rk of Object.keys(row)) {
              if (rk.toLowerCase().includes(k.toLowerCase())) return row[rk];
            }
          }
          return null;
        };
        
        const name = getVal(['name', 'product', 'item', 'description']) || 'Unknown Part';
        if (seen.has(name)) continue;
        seen.add(name);
        
        const manufacturer = getVal(['brand', 'manufacturer', 'make']) || 'Generic';
        const part_number = getVal(['part', 'number', 'sku']) || `PN-${uuidv4().substring(0,6).toUpperCase()}`;
        const priceStr = getVal(['price', 'mrp', 'rate']) || '0';
        let price = parseFloat(priceStr.toString().replace(/[^\d.]/g, ''));
        if (isNaN(price)) price = 0;
        
        let quantityStr = getVal(['qty', 'quantity', 'stock']) || '1';
        let quantity = parseInt(quantityStr.toString().replace(/[^\d]/g, ''));
        if (isNaN(quantity)) quantity = 1;
        
        const compatible_models = getVal(['compatible', 'model', 'bike']) ? getVal(['compatible', 'model', 'bike']).toString().split(',') : [];
        
        const desc = getVal(['desc', 'details']) || `Genuine ${manufacturer} ${name}.`;
        const full_description = `${desc}
Part Number: ${part_number}
Compatible Models: ${compatible_models.join(', ')}
Year: ${getVal(['year']) || 'Any'}
BS Stage: ${getVal(['bs', 'stage']) || 'BS6'}`;

        const imageUrl = 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80';

        products.push({
          id: uuidv4(),
          type: 'product',
          name: name,
          price: price,
          category: 'Spare Parts',
          description: full_description,
          imageUrl: imageUrl,
          images: [imageUrl],
          brand: manufacturer,
          stock: quantity,
          bikeModels: compatible_models,
          status: quantity > 0 ? 'available' : 'out_of_stock'
        });
      }
      
      toast.loading(`Uploading ${products.length} unique products...`, { id: toastId });
      
      const chunkSize = 50;
      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const { error } = await sb.from('products').upsert(chunk);
        if (error) throw error;
      }
      
      toast.success(`Successfully imported ${products.length} products!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Import failed: ${err.message}`, { id: toastId });
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    const qProducts = collection(db, 'products');
    const qBikes = collection(db, 'bikes');

    const unsubProducts = onSnapshot(qProducts, (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, type: 'product', ...d.data() } as Listing))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setListings(prev => {
        const others = prev.filter(l => l.type !== 'product');
        return [...others, ...prods].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    const unsubBikes = onSnapshot(qBikes, (snap) => {
      const bikes = snap.docs.map(d => ({ id: d.id, type: 'bike', ...d.data() } as Listing))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setListings(prev => {
        const others = prev.filter(l => l.type !== 'bike');
        return [...others, ...bikes].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bikes');
    });

    return () => {
      unsubProducts();
      unsubBikes();
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `listings/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      });

      const urls = await Promise.all(uploadPromises);
      
      setFormData(prev => {
        const currentImages = prev.images || [];
        const newImages = [...currentImages, ...urls];
        return { 
          ...prev, 
          images: newImages,
          imageUrl: prev.imageUrl || urls[0] // Set first image as main if not set
        };
      });
      toast.success(`${urls.length} image(s) uploaded!`);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = formData.type === 'product' ? 'products' : 'bikes';
    
    const processedData = { ...formData };
    if (typeof processedData.bikeModels === 'string') {
      processedData.bikeModels = (processedData.bikeModels as string)
        .split(',')
        .map(m => m.trim())
        .filter(m => m !== '');
    }

    try {
      if (editingListing) {
        await updateDoc(doc(db, collectionName, editingListing.id), processedData);
        toast.success("Listing updated!");
      } else {
        await addDoc(collection(db, collectionName), {
          ...processedData,
          createdAt: serverTimestamp()
        });
        toast.success("Listing added!");
      }
      setIsModalOpen(false);
      setEditingListing(null);
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (listing: Listing) => {
    const name = listing.name || listing.model;
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    const collectionName = listing.type === 'product' ? 'products' : 'bikes';
    try {
      await deleteDoc(doc(db, collectionName, listing.id));
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (listing: Listing) => {
    setEditingListing(listing);
    const formCopy = { ...listing };
    if (Array.isArray(formCopy.bikeModels)) {
      (formCopy as any).bikeModels = formCopy.bikeModels.join(', ');
    }
    if (!formCopy.images) formCopy.images = listing.imageUrl ? [listing.imageUrl] : [];
    setFormData(formCopy);
    setIsModalOpen(true);
  };

  const filteredListings = listings.filter(l => activeCategory === 'all' ? true : l.type === activeCategory);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex bg-card-bg p-1.5 rounded-2xl border border-text-primary/5">
          {(['all', 'bike', 'product'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeCategory === cat ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" : "text-gray-500 hover:text-white"
              )}
            >
              {cat === 'all' ? 'All Assets' : cat === 'bike' ? 'Bikes' : 'Spare Parts'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button 
              disabled={importing}
              className="bg-card-bg border border-text-primary/10 hover:border-brand-orange/50 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{importing ? 'Importing...' : 'Bulk Import Excel'}</span>
            </button>
          </div>

          <button 
            onClick={() => {
              setEditingListing(null);
              setFormData({ type: 'product', category: 'Accessories', status: 'available', images: [] });
              setIsModalOpen(true);
            }}
            className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 transition-all shadow-xl shadow-brand-orange/10 transform hover:-translate-y-0.5 active:scale-95"
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Create Listing</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-card-bg rounded-[3rem] border border-text-primary/5 border-dashed">
            <Package className="w-16 h-16 mx-auto mb-6 text-white/5" />
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No listings identified in this category</p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <motion.div 
              layout
              key={item.id} 
              className="bg-card-bg rounded-[2.5rem] overflow-hidden border border-text-primary/5 group hover:border-brand-orange/30 transition-all duration-500 flex flex-col"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img 
                  src={item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
                  alt={item.name || item.model} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
                    item.type === 'bike' ? "bg-brand-orange/20 border-brand-orange/30 text-brand-orange" : "bg-blue-500/20 border-blue-500/30 text-blue-500"
                  )}>
                    {item.type}
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(item)}
                      className="w-10 h-10 bg-white/10 backdrop-blur-md hover:bg-brand-orange hover:text-white rounded-xl flex items-center justify-center text-white transition-all shadow-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item)}
                      className="w-10 h-10 bg-white/10 backdrop-blur-md hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center text-white transition-all shadow-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg text-white mb-1 tracking-tight leading-none group-hover:text-brand-orange transition-colors">{item.name || item.model}</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.category || item.brand}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-brand-orange tracking-tighter">{formatPrice(item.price)}</div>
                    {item.type === 'bike' && <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{item.year} Model</div>}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-text-primary/5 flex items-center justify-between">
                  {item.type === 'product' ? (
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", (item.stock || 0) > 5 ? "bg-green-500" : (item.stock || 0) > 0 ? "bg-orange-500" : "bg-red-500")} />
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stock: {item.stock || 0} units</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bike className="w-3 h-3 text-gray-600" />
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.kms?.toLocaleString()} KMs</span>
                    </div>
                  )}
                  
                  <div className="text-[9px] font-black text-gray-400 bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest">#{item.id.slice(-4)}</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Listing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl glass rounded-[2.5rem] border border-text-primary/10 p-8 md:p-12 overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-bold mb-8">{editingListing ? 'Edit Listing' : 'Add Listing'}</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      disabled={!!editingListing}
                      className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange disabled:opacity-50"
                    >
                      <option value="product">Spare Part</option>
                      <option value="bike">Bike</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
                    <input 
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                      required
                    />
                  </div>
                </div>

                {formData.type === 'product' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                        <select 
                          value={formData.category || ''} 
                          onChange={(e) => setFormData({...formData, category: e.target.value})} 
                          className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                          {SPARE_PART_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-black">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Brand</label>
                        <input 
                          type="text" 
                          list="brand-list"
                          value={formData.brand || ''} 
                          onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                          className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" 
                        />
                        <datalist id="brand-list">
                          {BIKE_BRANDS.map(brand => <option key={brand} value={brand} />)}
                        </datalist>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                        <input type="number" value={formData.stock || ''} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Compatible Bikes (Comma separated)</label>
                        <input 
                          type="text" 
                          list="model-list"
                          value={formData.bikeModels || ''} 
                          onChange={(e) => setFormData({...formData, bikeModels: e.target.value as any})} 
                          placeholder="e.g. Classic 350, Bullet 500"
                          className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" 
                        />
                        <datalist id="model-list">
                          {ALL_MODELS.map(model => <option key={model} value={model} />)}
                        </datalist>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{formData.type === 'product' ? 'Product Name' : 'Bike Model'}</label>
                  <input 
                    type="text"
                    list={formData.type === 'bike' ? 'model-list' : undefined}
                    value={formData.type === 'product' ? formData.name : formData.model}
                    onChange={(e) => setFormData({...formData, [formData.type === 'product' ? 'name' : 'model']: e.target.value})}
                    className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                {formData.type === 'bike' && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Make / Brand</label>
                        <input 
                          type="text" 
                          list="brand-list"
                          value={formData.brand || ''} 
                          onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                          className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Year</label>
                        <input type="number" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">KMs / Mileage</label>
                        <input type="number" value={formData.kms || ''} onChange={(e) => setFormData({...formData, kms: Number(e.target.value)})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Engine CC</label>
                        <input type="number" value={formData.engineCc || ''} onChange={(e) => setFormData({...formData, engineCc: Number(e.target.value)})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" placeholder="e.g. 650" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Transmission</label>
                        <select 
                          value={formData.transmission || 'Manual'} 
                          onChange={(e) => setFormData({...formData, transmission: e.target.value as any})} 
                          className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange"
                        >
                          <option value="Manual">Manual</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Color</label>
                        <input type="text" value={formData.color || ''} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" placeholder="Midnight Black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">VIN</label>
                        <input type="text" value={formData.vin || ''} onChange={(e) => setFormData({...formData, vin: e.target.value})} className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange" placeholder="Chassis No." />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Maintenance History</label>
                      <textarea 
                        value={formData.maintenanceHistory || ''}
                        onChange={(e) => setFormData({...formData, maintenanceHistory: e.target.value})}
                        className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange min-h-[100px]"
                        placeholder="Detailed maintenance log, regular services, replacements..."
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea 
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-white/5 border border-text-primary/10 rounded-xl p-3 focus:outline-none focus:border-brand-orange min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase">Gallery Images</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {formData.images?.map((url, index) => (
                        <motion.div 
                          key={url}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-xl overflow-hidden group"
                        >
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <label className="aspect-square border-2 border-dashed border-text-primary/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange/50 transition-colors bg-white/5">
                      <Plus className="w-6 h-6 text-gray-500 mb-1" />
                      <span className="text-[8px] font-bold text-gray-500 uppercase">Add Image</span>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-brand-orange">
                       <Upload className="w-4 h-4 animate-bounce" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Uploading in progress...</span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white py-4 rounded-full font-bold transition-all disabled:opacity-50"
                >
                  {editingListing ? 'Update Listing' : 'Create Listing'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
