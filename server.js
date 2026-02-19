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
    if (!message) return res.status(400).send("Message empty");

    const key = String(process.env.GEMINI_API_KEY || "").trim();
    if (!key) return res.status(500).send("API Key missing");

    // ⚡ Gemini 1.5 Flash Model (Fastest) use kar rahe hain
    const url = https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key};

    const body = {
      system_instruction: {
        parts: [{ text: "You are Ritesh.ai. Reply in Hinglish. Be helpful and fast." }]
      },
      contents: [{ role: "user", parts: [{ text: message }] }]
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // Headers for Streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // ✅ Sabse important fix: JSON chunks se "text" nikalna bina crash hue
      const lines = chunk.split('\n');
      for (const line of lines) {
        // Regex use kar rahe hain taaki agar JSON adhura ho tab bhi text mil jaye
        const match = line.match(/"text":\s*"(.*?)"/);
        if (match && match[1]) {
          let cleanText = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"');
          res.write(cleanText); // Frontend ko ek-ek word jayega
        }
      }
    }
    res.end();

  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).send("Server Error: " + e.message);
    else res.end();
  }
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log("✅ Ritesh.ai Fixed on http://localhost:" + PORT);
});
