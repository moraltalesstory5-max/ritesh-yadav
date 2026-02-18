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
    if (!message) return res.json({ reply: "Ritesh boss, kuch likho 🙂" });

    const key = String(process.env.GEMINI_API_KEY || "").trim();
    if (!key) {
      return res.status(500).json({
        reply: "Ritesh boss, GEMINI_API_KEY missing hai. .env me key paste karo aur server restart karo."
      });
    }

    // ✅ Official Gemini API REST endpoint + model (as per docs example)
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"; // 1

    const body = {
      system_instruction: {
        parts: [{ text: "You are Ritesh.ai. Reply in Hinglish. Be helpful, clear, practical." }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ]
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Gemini returns { error: { message, ... } }
      const msg = data?.error?.message || JSON.stringify(data);
      return res.status(resp.status).json({ reply: "Ritesh boss, Gemini error: " + msg });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Ritesh boss, empty reply aaya 😕";

    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ reply: "Ritesh boss, server error: " + (e?.message || e) });
  }
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log("✅ Ritesh.ai running at http://localhost:" + PORT);
});
