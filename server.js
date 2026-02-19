const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const key = process.env.GEMINI_API_KEY;

    if (!key) return res.status(500).send("API Key missing");

    // Streaming URL
    const url = https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key};

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }]
      })
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // ⚡ Safe Parsing: JSON chunks ko line by line handle karna
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('"text":')) {
          try {
            const cleanLine = line.trim().replace(/,$/, ''); // Aakhri comma hatao
            const dummyObj = JSON.parse({${cleanLine}});
            if (dummyObj.text) {
              res.write(dummyObj.text);
            }
          } catch (e) {
            // Agar line adhuri hai toh skip karo, crash mat hone do
            continue;
          }
        }
      }
    }
    res.end();

  } catch (e) {
    console.error("Server Error:", e);
    if (!res.headersSent) res.status(500).send("Crash error: " + e.message);
    else res.end();
  }
});

app.listen(PORT, () => console.log("✅ Fixed Server on port " + PORT));
