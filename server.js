import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

// ✅ Serve public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Gemini setup
const API_KEY = process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY missing. Add it in .env");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ reply: "Empty message." });

    // model (fast + cheap)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // System instruction
    const SYSTEM = `You are Ritesh.ai, a helpful assistant. Reply in Hinglish (70% Hindi, 30% English).
Be friendly, short, and practical. If user asks coding, give steps.`;

    // IMPORTANT: template string must use backticks (no $ error)
    const prompt = ${SYSTEM}\n\nUser: ${message}\nAssistant:;

    const result = await model.generateContent(prompt);
    const reply = result.response.text()?.trim() || "Reply empty aa gaya.";

    res.json({ reply });
  } catch (e) {
    // quota or key error
    const msg = String(e?.message || e);
    console.error("Gemini Error:", msg);

    // user friendly
    if (msg.toLowerCase().includes("quota")) {
      return res.status(429).json({
        reply:
          "Ritesh boss, quota/limit lag gaya. Thoda wait karo ya billing/plan check karo (ya model change karo)."
      });
    }
    return res.status(500).json({
      reply: "Ritesh boss, server error aa gaya. Console me error dekho."
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(✅ Server running: http://localhost:${PORT});
});
