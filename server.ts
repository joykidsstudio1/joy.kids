import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to handle AI operations
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      let attempt = 0;
      let lastError;
      const maxRetries = 3;

      while (attempt < maxRetries) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: systemInstruction || "You are an expert YouTube assistant.",
            }
          });
          
          return res.json({ text: response.text });
        } catch (err: any) {
          lastError = err;
          const msg = err.message || "";
          // Check for 503 Unavailable
          if (err.status === 503 || msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
            attempt++;
            if (attempt < maxRetries) {
              console.log(`Gemini API 503, retrying attempt ${attempt}...`);
              // wait for 2 seconds before retrying
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          }
          // If it's not a 503 or we ran out of retries, break
          break;
        }
      }

      // If we got here, it means we exhausted retries or hit a different error
      let errorMessage = lastError?.message || "Failed to generate AI content";
      if (lastError?.status === 503 || errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('UNAVAILABLE')) {
        errorMessage = 'يواجه الذكاء الاصطناعي ضغطاً عالياً حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
      } else {
        console.error(lastError);
      }
      res.status(500).json({ error: errorMessage });

    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || "Failed to generate AI content";
      res.status(500).json({ error: errorMessage });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
