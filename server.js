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

    if (!message) {
      return res.json({ reply: "❌ Message empty hai" });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.json({ reply: "❌ GEMINI_API_KEY missing hai" });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      API_KEY;

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000); // 15 sec timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Answer briefly, clean formatting, short paragraphs.\n\nUser question:\n" +
                  message
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "❌ No response from AI";

    // ✨ CLEAN FORMAT
    reply = reply
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({
      reply: "⚠️ AI thoda busy hai, 2 sec baad try karo"
    });
  }
});

