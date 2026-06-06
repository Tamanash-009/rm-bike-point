import "dotenv/config";
import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(xss());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "10kb" }));

// Clerk Middleware
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
// @ts-ignore
const genAI = ai as any;

// AI Chat Route
app.post("/api/chat", requireAuth(), async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const authState = getAuth(req);
  const userId = authState.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // No usage limit — open for all authenticated users

    const searchProductsTool = {
      functionDeclarations: [
        {
          name: "search_products",
          description: "Search for motorcycle spare parts and accessories by name, category, or brand.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: {
                type: Type.STRING,
                description: "The search term (e.g., 'brake pad', 'Yamaha oil filter')"
              }
            },
            required: ["query"]
          }
        }
      ]
    };

    const response = await genAI.models.generateContent({ 
      model: "gemini-2.0-flash",
      contents: [
        ...(history || []),
        { role: "user", parts: [{ text: message }] }
      ],
      tools: [searchProductsTool],
      config: {
        systemInstruction: `
          You are the official AI Assistant for R.M Bike Point, Kolkata — India's premium motorcycle service center.
          You help customers with bike servicing, genuine spare parts, and pre-owned bikes.
          
          Guidelines:
          - If the user asks about product prices or availability, use the 'search_products' tool.
          - When presenting products, format them clearly. If a product is available, follow with the tag [SHOP_NOW:id] where 'id' is the product's document ID.
          - Answer questions about services: General Service, Engine Tuning, Brake Overhaul, Oil Change, Washing & Polishing, Major Repair.
          - Location: Jhosser Road, Dighar More, Barasat, Kolkata 700125. Phone: +91 62893 28280.
          - FALLBACK: If you're unsure, say: "Connect with us on WhatsApp: https://wa.me/916289328280"
          - Be professional, bold, and energetic. Keep answers concise.
        `,
      }
    });

    let finalResponse = response;
    if (response.functionCalls) {
      const toolResults = [];
      for (const call of response.functionCalls) {
        if (call.name === "search_products") {
          const queryText = call.args.query as string;
          
          const { data: products } = await supabase.from('products').select('*');
          
          const filtered = (products || []).filter((p: any) => 
            p.name.toLowerCase().includes(queryText.toLowerCase()) ||
            p.category?.toLowerCase().includes(queryText.toLowerCase()) ||
            p.brand?.toLowerCase().includes(queryText.toLowerCase())
          ).slice(0, 5);
          
          toolResults.push({
            name: call.name,
            response: { result: filtered },
            id: call.id
          });
        }
      }

      finalResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          ...(history || []),
          { role: "user", parts: [{ text: message }] },
          response.candidates?.[0]?.content as any,
          {
            role: "model",
            parts: toolResults.map(r => ({
              functionResponse: {
                name: r.name,
                response: r.response,
              }
            }))
          }
        ],
        config: {
          systemInstruction: `You are the official AI Assistant for R.M Bike Point. Summarize the product info found. Always include [SHOP_NOW:id] for available products.`,
        }
      });
    }

    const text = finalResponse.text || "I'm sorry, I couldn't process that. Please try again.";

    res.json({ reply: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// Automated Service Reminders
app.post("/api/admin/process-reminders", requireAuth(), async (req, res) => {
  try {
    const authState = getAuth(req);
    const userId = authState.userId;
    
    const { data: userDoc } = await supabase.from('users').select('role').eq('id', userId).single();
    if (userDoc?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const { data: bookings } = await supabase.from('bookings')
      .select('*')
      .lte('nextServiceDate', today)
      .eq('reminderSent', false)
      .limit(50);

    if (!bookings || bookings.length === 0) {
      return res.json({ message: "No reminders due today", count: 0 });
    }

    const results = [];
    for (const data of bookings) {
      // Update reminder state
      await supabase.from('bookings').update({ 
        reminderSent: true, 
        reminderSentAt: new Date().toISOString() 
      }).eq('id', data.id);
      
      results.push({ email: data.userEmail, bike: data.bikeModel });
    }

    res.json({ message: "Reminders processed successfully", count: results.length, details: results });
  } catch (error) {
    console.error("Reminder processing error:", error);
    res.status(500).json({ error: "Failed to process reminders" });
  }
});

// API Routes
app.delete("/api/posts/:id", requireAuth(), async (req, res) => {
  const { id } = req.params;
  
  try {
    const authState = getAuth(req);
    const { data: userDoc } = await supabase.from('users').select('role').eq('id', authState.userId).single();
    
    if (userDoc?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    await supabase.from('comments').delete().eq('post_id', id);
    await supabase.from('blogPosts').delete().eq('id', id);

    res.status(200).json({ message: "Post and associated comments deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Server error during deletion" });
  }
});

export default app;
