import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cron from "node-cron";
import { runStoryPipeline } from "./server/pipeline.ts";
import { createServer } from "http";
import { Server } from "socket.io";

// Simple in-memory config store for cron job
let autopilotConfig = {
  enabled: false,
  topic: "",
  scheduleTime: "12:00", // HH:mm
  accessToken: "",
};
let currentCronJob: any = null;
let lastRunLog: any = null;

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.json());

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
  });

  // AutoPilot Endpoints
  app.get("/api/autopilot/config", (req, res) => {
    res.json({
      config: { ...autopilotConfig, accessToken: autopilotConfig.accessToken ? "SET" : "" },
      lastRun: lastRunLog,
    });
  });

  app.post("/api/autopilot/config", (req, res) => {
    const { enabled, topic, scheduleTime, accessToken } = req.body;
    
    autopilotConfig = {
      enabled,
      topic,
      scheduleTime,
      accessToken: accessToken || autopilotConfig.accessToken,
    };

    // Update cron job
    if (currentCronJob) {
      currentCronJob.stop();
      currentCronJob = null;
    }

    if (enabled && scheduleTime) {
      const [hour, minute] = scheduleTime.split(":");
      const cronExpr = `${minute} ${hour} * * *`;
      console.log(`[AutoPilot] Scheduling story generation for cron: ${cronExpr}`);
      
      currentCronJob = cron.schedule(cronExpr, async () => {
        console.log(`[AutoPilot] Cron triggered at ${new Date().toISOString()}`);
        try {
          const result = await runStoryPipeline(autopilotConfig.topic, io, autopilotConfig.accessToken);
          lastRunLog = { status: 'success', time: new Date().toISOString(), result };
          console.log("[AutoPilot] Pipeline finished successfully.");
        } catch (error: any) {
          lastRunLog = { status: 'error', time: new Date().toISOString(), error: error.message };
          console.error("[AutoPilot] Pipeline failed:", error);
        }
      });
    }

    res.json({ success: true, config: { ...autopilotConfig, accessToken: !!autopilotConfig.accessToken } });
  });

  app.post("/api/autopilot/trigger", async (req, res) => {
    console.log("[AutoPilot] Manual manual trigger requested");
    try {
      const result = await runStoryPipeline(autopilotConfig.topic || "قصة عن الصداقة والحيوانات", io, autopilotConfig.accessToken);
      lastRunLog = { status: 'success', time: new Date().toISOString(), result };
      res.json(result);
    } catch (error: any) {
      lastRunLog = { status: 'error', time: new Date().toISOString(), error: error.message };
      res.status(500).json({ error: error.message });
    }
  });

  // Serve pipeline output statically
  app.use('/pipeline-output', express.static(path.join(process.cwd(), 'dist', 'pipeline-output')));

  // API Route to handle AI operations
  app.post("/api/ai", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not set" });
      }
      const ai = new GoogleGenAI({ apiKey });
      
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
