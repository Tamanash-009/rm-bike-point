import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateSlug(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log("Reading Inventory stock.xlsx...");
  
  if (!fs.existsSync('Inventory stock.xlsx')) {
    console.error("Inventory stock.xlsx not found!");
    process.exit(1);
  }

  const workbook = xlsx.readFile('Inventory stock.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  console.log(`Found ${rawData.length} rows in the excel file.`);

  const products = [];

  for (const row of rawData) {
    // Attempt to map columns intelligently. Excel columns might have different headers.
    // Try to find the closest match.
    const getVal = (possibleKeys) => {
      for (const k of possibleKeys) {
        for (const rk of Object.keys(row)) {
          if (rk.toLowerCase().includes(k.toLowerCase())) return row[rk];
        }
      }
      return null;
    };

    const name = getVal(['name', 'product', 'item', 'description']) || 'Unknown Part';
    const manufacturer = getVal(['brand', 'manufacturer', 'make']) || 'Generic';
    const part_number = getVal(['part', 'number', 'sku']) || `PN-${uuidv4().substring(0,6).toUpperCase()}`;
    const priceStr = getVal(['price', 'mrp', 'rate']) || '0';
    let price = parseFloat(priceStr.toString().replace(/[^\d.]/g, ''));
    if (isNaN(price)) price = 0;
    
    let quantityStr = getVal(['qty', 'quantity', 'stock']) || '1';
    let quantity = parseInt(quantityStr.toString().replace(/[^\d]/g, ''));
    if (isNaN(quantity)) quantity = 1;

    let stock_status = quantity > 20 ? 'In Stock' : (quantity > 0 ? 'Low Stock' : 'Out Of Stock');

    const compatible_models = getVal(['compatible', 'model', 'bike']) ? getVal(['compatible', 'model', 'bike']).toString().split(',') : [];

    const search_keywords = [
      name.toLowerCase(),
      manufacturer.toLowerCase(),
      part_number.toLowerCase(),
      ...compatible_models.map(m => m.trim().toLowerCase())
    ];

    const desc = getVal(['desc', 'details']) || `Genuine ${manufacturer} ${name}.`;
    const full_description = `${desc}
Part Number: ${part_number}
Compatible Models: ${compatible_models.join(', ')}
Year: ${getVal(['year']) || 'Any'}
BS Stage: ${getVal(['bs', 'stage']) || 'BS6'}`;

    products.push({
      id: uuidv4(),
      name: name,
      price: price,
      category: 'Spare Parts',
      description: full_description,
      image_url: 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80',
      brand: manufacturer,
      in_stock: quantity > 0,
      created_at: new Date().toISOString()
    });
  }

  // Deduplicate by name just in case
  const uniqueProducts = [];
  const seen = new Set();
  for (const p of products) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      uniqueProducts.push(p);
    }
  }

  console.log(`Prepared ${uniqueProducts.length} unique products for upload.`);

  // Upload in chunks of 50 to Supabase
  const chunkSize = 50;
  for (let i = 0; i < uniqueProducts.length; i += chunkSize) {
    const chunk = uniqueProducts.slice(i, i + chunkSize);
    console.log(`Uploading chunk ${Math.floor(i/chunkSize) + 1}...`);
    
    const { error } = await supabase.from('products').upsert(chunk);
    if (error) {
      console.error("Error uploading chunk:", error);
      // Wait, if table 'products' doesn't exist, it will throw an error
    }
  }

  console.log("Import complete!");
}

run().catch(console.error);
