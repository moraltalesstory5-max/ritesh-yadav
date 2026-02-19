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
    if (!message) return res.status(400).send("Message is empty");

    const key = String(process.env.GEMINI_API_KEY || "").trim();
    if (!key) return res.status(500).send("API Key missing");

    // ⚡ Fast model (Flash) aur Streaming endpoint
    const url = https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key};

    const body = {
      system_instruction: {
        parts: [{ text: "You are Ritesh.ai. Reply in Hinglish. Be helpful, clear, and very fast." }]
      },
      contents: [{ role: "user", parts: [{ text: message }] }]
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Client ko batana ki data stream ho raha hai
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Gemini ke stream se sirf text nikalne ka logic
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.includes('"text":')) {
          const match = line.match(/"text":\s*"(.*)"/);
          if (match) {
            let cleanText = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"');
            res.write(cleanText); // Turant bhejo frontend ko
          }
        }
      }
    }
    res.end();

  } catch (e) {
    console.error(e);
    res.status(500).end("Error: " + e.message);
  }
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log("✅ Ritesh.ai Fixed & Running at http://localhost:" + PORT);
});
