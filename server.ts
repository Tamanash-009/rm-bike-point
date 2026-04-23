import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
// @ts-ignore - The SDK types might be slightly different in this environment
const genAI = ai as any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  // In AI Studio, credentials are often handled via env or automatic discovery
  // For this environment, we assume the service account is available if configured
  // or we use the project ID if provided in config.
  // Since we don't have a private key JSON here usually, we might rely on the environment's ADC.
  admin.initializeApp();
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // AI Chat Route
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Define tools for product search
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
        model: "gemini-3-flash-preview",
        contents: [
          ...(history || []),
          { role: "user", parts: [{ text: message }] }
        ],
        tools: [searchProductsTool],
        config: {
          systemInstruction: `
            You are the official AI Assistant for R.M Bike Point, Kolkata.
            You help customers with bike servicing, genuine spare parts, and pre-owned bikes.
            
            Guidelines:
            - If the user asks about product prices or availability, use the 'search_products' tool.
            - When presenting products, format them clearly. If a product is available, follow with the tag [SHOP_NOW:id] where 'id' is the product's document ID.
            - If you cannot find a specific product, check our services or general categories.
            - FALLBACK: If you're unsure or cannot help, say: "I couldn't find the exact info. Connect with us directly on WhatsApp." and include the link: https://wa.me/916289328280
            - Be bold, professional, and energetic.
          `,
        }
      });

      // Handle function calls if they exist
      let finalResponse = response;
      if (response.functionCalls) {
        const toolResults = [];
        for (const call of response.functionCalls) {
          if (call.name === "search_products") {
            const queryText = call.args.query as string;
            const productsRef = admin.firestore().collection('products');
            // Basic search integration: Fetch all and filter (for small catalog)
            // In production, use specialized search or field-based filtering
            const snapshot = await productsRef.get();
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const filtered = products.filter((p: any) => 
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

        // Send back the tool results to get the final text response
        finalResponse = await genAI.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...(history || []),
            { role: "user", parts: [{ text: message }] },
            response.candidates?.[0]?.content as any, // The model's call
            {
              role: "model", // Actually this is the tool result
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
  app.post("/api/admin/process-reminders", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // Role check: Only admin
      if (decodedToken.email !== "chakrabortytamanash@gmail.com") {
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        if (userDoc.data()?.role !== 'admin') {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const bookingsRef = db.collection("bookings");
      
      // Find bookings where nextServiceDate is today or past, and reminder not sent yet
      const snapshot = await bookingsRef
        .where("nextServiceDate", "<=", today)
        .where("reminderSent", "==", false)
        .limit(50) // Process in batches
        .get();

      if (snapshot.empty) {
        return res.json({ message: "No reminders due today", count: 0 });
      }

      const batch = db.batch();
      const mailRef = db.collection("mail");
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // 1. Create a "mail" document for Trigger Email extension
        const mailDoc = mailRef.doc();
        batch.set(mailDoc, {
          to: data.userEmail,
          message: {
            subject: `Maintenance Reminder: ${data.bikeModel} | R.M Bike Point`,
            text: `Hi ${data.userName || 'Rider'},\n\nIt's time for your motorcycle's next service at R.M Bike Point!\n\nBike: ${data.bikeModel}\nSuggested Interval: ${data.serviceInterval} Months\n\nBook your slot now to keep your machine in peak condition: https://ais-dev-x2ccbf6wr3zywjpgygsvdk-359060115892.asia-east1.run.app/booking\n\nStay Safe,\nR.M Bike Point Team`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #E11D48;">Time for a Tune-up! 🏍️</h2>
                <p>Hi <b>${data.userName || 'Rider'}</b>,</p>
                <p>It's time for your motorcycle's next service at <b>R.M Bike Point</b>.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><b>Bike:</b> ${data.bikeModel}</p>
                  <p style="margin: 5px 0;"><b>Last Service:</b> ${data.date}</p>
                  <p style="margin: 5px 0;"><b>Service Type:</b> ${data.serviceType}</p>
                </div>
                <p>Regular maintenance ensures safety, performance, and longevity of your machine.</p>
                <a href="https://ais-dev-x2ccbf6wr3zywjpgygsvdk-359060115892.asia-east1.run.app/booking" 
                   style="display: inline-block; background: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 10px;">
                   Book Service Now
                </a>
                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #777;">R.M Bike Point | Jhosser Road, Dighar More, Kolkata</p>
              </div>
            `
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Mark reminder as sent
        batch.update(doc.ref, { reminderSent: true, reminderSentAt: admin.firestore.FieldValue.serverTimestamp() });
        results.push({ email: data.userEmail, bike: data.bikeModel });
      });

      await batch.commit();
      res.json({ message: "Reminders processed successfully", count: results.length, details: results });
    } catch (error) {
      console.error("Reminder processing error:", error);
      res.status(500).json({ error: "Failed to process reminders" });
    }
  });

  // API Routes
  app.delete("/api/posts/:id", async (req, res) => {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userEmail = decodedToken.email;

      // Role check: Only the specified admin can delete
      if (userEmail !== "chakrabortytamanash@gmail.com") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      const postRef = db.collection("blogPosts").doc(id);
      const commentsRef = postRef.collection("comments");

      // Batch delete comments and post
      const batch = db.batch();
      const commentsSnap = await commentsRef.get();
      
      commentsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batch.delete(postRef);

      await batch.commit();

      res.status(200).json({ message: "Post and associated comments deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Server error during deletion" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`R.M Bike Point Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
