const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---- ✅ Init Gemini ONCE (BIG SPEED FIX) ----
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY missing in env.");
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ✅ Use FLASH for speed (Pro is slower)
const model = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 512, // ✅ speed
      },
    })
  : null;

const SYSTEM_PROMPT =
  "You are Ritesh.ai, a helpful assistant. Reply in Hinglish (Hindi+English). " +
  "Keep answers clear and practical. If user asks coding, give working code.";

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const started = Date.now();
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.json({ reply: "Ritesh boss, kuch likho 🙂" });

    if (!model) {
      return res.status(500).json({ reply: "GEMINI_API_KEY missing. Env me set karo." });
    }

    // ✅ Keep prompt small for speed
    const prompt = ${SYSTEM_PROMPT}\n\nUser: ${message}\nAI:;

    const result = await model.generateContent(prompt);
    const reply = result?.response?.text?.() || "Ritesh boss, empty reply aaya.";

    const ms = Date.now() - started;
    res.set("X-Response-Time-ms", String(ms));
    return res.json({ reply, ms });
  } catch (err) {
    const msg = err?.message ? String(err.message) : String(err);
    return res.status(500).json({ reply: "Ritesh boss, Gemini error: " + msg });
  }
});

app.listen(PORT, () => console.log("✅ Ritesh.ai running on port", PORT));
