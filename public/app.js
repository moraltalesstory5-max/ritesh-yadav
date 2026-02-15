// =======================
// Ritesh.ai - app.js (FULL)
// =======================

const chat = document.getElementById("chat");
const home = document.getElementById("home");
const messages = document.getElementById("messages");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

const newChatBtn = document.getElementById("newChatBtn");
const helpBtn = document.getElementById("helpBtn");

// ✅ Your backend endpoint
const API_URL = "https://ritesh-yadav-production-42f0.up.railway.app/api/chat";

// ===== Upload state (TXT attach) =====
let selectedFileText = "";
let selectedFileName = "";

// ===== Helpers =====
function updateHome() {
  const hasMsgs = messages && messages.children.length > 0;
  if (!home) return;
  home.style.display = hasMsgs ? "none" : "flex";
}

function scrollBottom() {
  if (!chat) return;
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = msg ${who};
  div.textContent = text;
  messages.appendChild(div);
  updateHome();
  scrollBottom();
  return div;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.textContent = "…";
  messages.appendChild(div);
  updateHome();
  scrollBottom();
  return div;
}

function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ===== Quick buttons =====
document.querySelectorAll(".quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;

    const map = {
      image: "Create an image prompt for: ",
      write: "Help me write: ",
      summary: "Summarize this: ",
      surprise: "Surprise me."
    };

    input.value = map[mode] || "";
    input.focus();
  });
});

// ===== New Chat =====
if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    messages.innerHTML = "";
    selectedFileText = "";
    selectedFileName = "";
    fileInput.value = "";
    updateHome();
    input.focus();
  });
}

if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    addMessage(
      "✅ Tips:\n1) Voice: Chrome + HTTPS required\n2) Upload: abhi .txt auto-attach supported\n3) 502 = backend down (Railway) — frontend ok ho tab bhi reply nahi aayega",
      "ai"
    );
  });
}

// ===== Upload (TXT only attach) =====
if (uploadBtn) {
  uploadBtn.addEventListener("click", () => fileInput.click());
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
  if (!file) return;

  selectedFileText = "";
  selectedFileName = file.name;

  addMessage(📎 Selected: ${file.name}, "user");

  const isTxt =
    file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
  const maxBytes = 200 * 1024; // 200KB

  if (!isTxt) {
    addMessage(
      "⚠️ Abhi sirf .txt file auto-attach hoti hai. (Image/PDF ke liye backend upload add karna padega)",
      "ai"
    );
    return;
  }

  if (file.size > maxBytes) {
    addMessage("⚠️ TXT bahut bada hai. 200KB se chhota rakho.", "ai");
    return;
  }

  try {
    selectedFileText = await readText(file);
    addMessage("✅ TXT ready. Ab message send karo, file text bhi jayega.", "ai");
  } catch (e) {
    addMessage("❌ File read failed: " + e.message, "ai");
  }
});

function readText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read error"));
    r.readAsText(file);
  });
}

// ===== Voice (SpeechRecognition) =====
if (micBtn) {
  micBtn.addEventListener("click", () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      addMessage("❌ Voice not supported. (Use Chrome latest)", "ai");
      return;
    }
    if (!window.isSecureContext) {
      addMessage("❌ Voice needs HTTPS. HTTP pe mic kaam nahi karega.", "ai");
      return;
    }

    const rec = new SR();
    rec.lang = "hi-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => addMessage("🎙️ Listening…", "ai");

    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      if (text.trim()) {
        input.value = text.trim();
        input.focus();
      }
    };

    rec.onerror = (e) =>
      addMessage("❌ Mic error: " + (e.error || "unknown"), "ai");

    rec.onend = () => addMessage("✅ Voice stopped.", "ai");

    try {
      rec.start();
    } catch (err) {
      addMessage("❌ Mic start failed: " + err.message, "ai");
    }
  });
}

// ===== Send =====
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const typing = addTyping();
  sendBtn.disabled = true;
  input.disabled = true;

  try {
    const payload = { message: text };

    // attach txt (optional)
    if (selectedFileText) {
      payload.fileName = selectedFileName;
      payload.fileText = selectedFileText.slice(0, 15000);
      // reset after attach
      selectedFileText = "";
      selectedFileName = "";
      fileInput.value = "";
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const ct = res.headers.get("content-type") || "";

    // If backend error (502/500/404 etc)
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      typing.remove();

      // try parse json error
      const j = safeJSONParse(raw);
      const msg = j?.message || raw || "Server not responding";

      addMessage(❌ API error ${res.status}: ${msg}, "ai");
      return;
    }

    // If not JSON (HTML returned)
    if (!ct.includes("application/json")) {
      const raw = await res.text().catch(() => "");
      typing.remove();
      addMessage(
        "❌ Server JSON nahi bhej raha (HTML aa raha). Backend route /api/chat JSON return kare.",
        "ai"
      );
      console.log("NON-JSON RESPONSE:", raw);
      return;
    }

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage("❌ Network/Server error: " + err.message, "ai");
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    updateHome();
    scrollBottom();
  }
}

// Init
updateHome();
