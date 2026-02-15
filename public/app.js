const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// Guard: agar HTML me buttons missing ho to error na aaye
if (!chat || !input || !sendBtn) {
  console.error("Missing required elements: #chat, #input, #send");
}

/* -------------------- FILE UPLOAD (REAL) -------------------- */
if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    addMsg(
      "user",
      📎 Uploading: ${file.name} (${Math.round(file.size / 1024)} KB)
    );

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(Upload failed: HTTP ${r.status} ${t}.trim());
      }

      const data = await r.json();

      addMsg(
        "ai",
        `✅ Uploaded: ${data.originalName || file.name}\nSaved as: ${
          data.filename || "(server did not return filename)"
        }`
      );
    } catch (e) {
      addMsg("ai", "❌ Upload error: " + (e?.message || e));
    } finally {
      fileInput.value = ""; // reset so same file can be uploaded again
    }
  });
} else {
  console.warn("Upload UI not found: #uploadBtn or #fileInput missing in HTML");
}

/* -------------------- VOICE INPUT (WORKING) -------------------- */
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMsg("ai", "❌ Voice not supported. Use Chrome on Android/PC & HTTPS.");
    return;
  }

  const rec = new SR();
  rec.lang = "hi-IN";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  addMsg("ai", "🎙️ Listening... bol do");

  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || "";
    if (text) input.value = text;
  };

  rec.onerror = (e) => {
    addMsg("ai", "❌ Mic error: " + (e?.error || "unknown"));
  };

  rec.start(); // must be user gesture (button click)
}

if (micBtn) {
  micBtn.addEventListener("click", startVoice);
} else {
  console.warn("Mic UI not found: #micBtn missing in HTML");
}

/* -------------------- CHAT SEND -------------------- */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMsg("user", text);
  sendBtn.disabled = true;

  const typing = addMsg("ai", "Typing...");

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(Chat API error HTTP ${r.status} ${t}.trim());
    }

    const data = await r.json();
    typing.textContent = data.reply || "No reply";
  } catch (e) {
    typing.textContent = "❌ Error: " + (e?.message || e);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
