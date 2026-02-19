const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ reply: "Kuch likho bhai!" });

    const key = String(process.env.GEMINI_API_KEY || "").trim();
    if (!key) return res.status(500).json({ reply: "API Key missing hai!" });

    // ✅ Gemini 1.5 Flash: Ye bohot fast hai
    const url = https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key};

    const body = {
      system_instruction: {
        parts: [{ text: "You are Ritesh.ai. Reply in Hinglish. Keep it short and fast." }]
      },
      contents: [{ role: "user", parts: [{ text: message }] }]
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ reply: "Gemini error: " + (data.error?.message || "Unknown error") });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No reply from AI.";
    
    // Seedha JSON reply bhejo
    return res.json({ reply });

  } catch (e) {
    console.error("Server Error:", e);
    return res.status(500).json({ reply: "Server error: " + e.message });
  }
});

app.listen(PORT, () => console.log("✅ Stable Ritesh.ai running on port " + PORT));
