const express = require("express");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ✅ Serve UI
app.use(express.static(path.join(__dirname, "public")));

// ✅ Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Health
app.get("/health", (req, res) => res.send("OK"));

// ✅ Chat (Gemini)
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ reply: "Ritesh boss, kuch likho 🙂" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({
        reply: "Ritesh boss, GEMINI_API_KEY missing hai. Railway Variables ya local env me set karo."
      });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const SYSTEM =
      "You are Ritesh.ai. Reply in Hinglish (70% Hindi, 30% English). " +
      "Be calm, short, practical.";

    const prompt = ${SYSTEM}\n\nUser: ${message}\nAssistant:;
    const result = await model.generateContent(prompt);
    const reply = result?.response?.text?.() || "Ritesh boss, empty reply aaya.";

    return res.json({ reply });
  } catch (e) {
    const msg = String(e?.message || e);
    return res.status(500).json({ reply: "Ritesh boss, Gemini error: " + msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Running on port:", PORT));
