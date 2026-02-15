const chat = document.getElementById("chat");
const messages = document.getElementById("messages");
const home = document.getElementById("home");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

const newChatBtn = document.getElementById("newChatBtn");

// ✅ IMPORTANT: single API URL (ensure this is correct)
const API_URL = "https://ritesh-yadav-production-42f0.up.railway.app/api/chat";

let selectedFile = null;
let selectedFileText = ""; // only for .txt (small)

// ---------- UI helpers ----------
function updateHomeVisibility() {
  const hasMsgs = messages && messages.children.length > 0;
  if (home) home.style.display = hasMsgs ? "none" : "flex";
}

function scrollToBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + (who === "ai" ? "ai" : "user");
  div.textContent = text;
  messages.appendChild(div);
  updateHomeVisibility();
  scrollToBottom();
  return div;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.innerHTML = …; // simple typing (you can replace with dots animation)
  messages.appendChild(div);
  updateHomeVisibility();
  scrollToBottom();
  return div;
}

function setBusy(isBusy) {
  // ✅ only disable send + input (mic/upload selectable)
  sendBtn.disabled = isBusy;
  input.disabled = isBusy;
}

// ---------- quick buttons (optional) ----------
document.querySelectorAll(".quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    const templates = {
      image: "Create an image prompt for: ",
      write: "Help me write: ",
      summary: "Summarize this: ",
      surprise: "Surprise me with something fun."
    };
    input.value = templates[mode] || "";
    input.focus();
  });
});

// ---------- new chat ----------
newChatBtn?.addEventListener("click", () => {
  messages.innerHTML = "";
  selectedFile = null;
  selectedFileText = "";
  fileInput.value = "";
  updateHomeVisibility();
});

// ---------- upload ----------
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
  selectedFileText = "";

  if (!selectedFile) return;

  addMessage(📎 Selected: ${selectedFile.name}, "user");

  // ✅ only read .txt files (<= 200KB) into message
  const isTxt = selectedFile.type === "text/plain" || selectedFile.name.toLowerCase().endsWith(".txt");
  const maxBytes = 200 * 1024;

  if (isTxt && selectedFile.size <= maxBytes) {
    selectedFileText = await readFileAsText(selectedFile);
    addMessage("✅ TXT file ready to send with your next message.", "ai");
  } else {
    addMessage("⚠️ File selected. But backend upload support nahi hai. TXT (<=200KB) hi auto-send hoga.", "ai");
  }
});

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsText(file);
  });
}

// ---------- voice ----------
micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ✅ check secure + support
  if (!SpeechRecognition) {
    addMessage("❌ Voice not supported. (Use Chrome latest / SpeechRecognition missing)", "ai");
    return;
  }
  if (!window.isSecureContext) {
    addMessage("❌ Voice needs HTTPS. HTTP pe mic kaam nahi karega.", "ai");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "hi-IN"; // change to "en-IN" if you want English
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onstart = () => addMessage("🎙️ Listening…", "ai");
  rec.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    if (text.trim()) {
      input.value = text.trim();
      input.focus();
    }
  };
  rec.onerror = (e) => addMessage("❌ Mic error: " + (e.error || "unknown"), "ai");
  rec.onend = () => addMessage("✅ Voice stopped.", "ai");

  rec.start();
});

// ---------- send ----------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  updateHomeVisibility();

  const typing = addTyping();
  setBusy(true);

  try {
    // ✅ always send JSON (backend simple)
    const payload = { message: text };

    // ✅ if TXT file loaded, attach it as extra text
    if (selectedFileText) {
      payload.fileName = selectedFile?.name || "";
      payload.fileText = selectedFileText.slice(0, 15000); // limit
      // reset after attach
      selectedFile = null;
      selectedFileText = "";
      fileInput.value = "";
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // read response safely
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      let errMsg = "";
      if (contentType.includes("application/json")) {
        const j = await res.json().catch(() => ({}));
        errMsg = j.message || JSON.stringify(j);
      } else {
        errMsg = await res.text().catch(() => "");
      }
      typing.remove();
      addMessage(❌ API error ${res.status}: ${errMsg || "Server not responding"}, "ai");
      return;
    }

    if (!contentType.includes("application/json")) {
      const raw = await res.text();
      typing.remove();
      addMessage("❌ Server JSON nahi bhej raha (HTML/other). Backend fix needed.", "ai");
      console.log("RAW RESPONSE:", raw);
      return;
    }

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");
    updateHomeVisibility();

  } catch (err) {
    typing.remove();
    addMessage("❌ Network/Server error: " + err.message, "ai");
  } finally {
    setBusy(false);
  }
}

// initial
updateHomeVisibility();
