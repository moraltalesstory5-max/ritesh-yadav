// ===== Grab elements (must exist in HTML) =====
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

// ===== If something missing, show clear error =====
const required = { chat, home, messages, input, sendBtn, uploadBtn, fileInput, micBtn, newChatBtn, helpBtn };
for (const [k, v] of Object.entries(required)) {
  if (!v) {
    alert(HTML missing element id="${k}". Replace index.html exactly as given.);
    throw new Error(Missing element: ${k});
  }
}

// ✅ Your API endpoint
const API_URL = "https://ritesh-yadav-production-42f0.up.railway.app/api/chat";

// ===== Upload state =====
let selectedFileText = "";
let selectedFileName = "";

// ===== Helpers =====
function updateHome() {
  home.style.display = messages.children.length ? "none" : "flex";
}
function scrollBottom() {
  chat.scrollTop = chat.scrollHeight;
}
function addMessage(text, who) {
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

// ===== Home quick buttons =====
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

// ===== New chat =====
newChatBtn.addEventListener("click", () => {
  messages.innerHTML = "";
  selectedFileText = "";
  selectedFileName = "";
  fileInput.value = "";
  updateHome();
  input.focus();
});

// ===== Help =====
helpBtn.addEventListener("click", () => {
  addMessage(
    "Fix checklist:\n1) Reply nahi aa raha = backend 502/500.\n2) Voice works only on HTTPS + Chrome.\n3) Upload abhi .txt support karta hai (simple attach).",
    "ai"
  );
});

// ===== Upload =====
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  selectedFileText = "";
  selectedFileName = file.name;

  addMessage(📎 Selected: ${file.name}, "user");

  const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
  if (!isTxt) {
    addMessage("⚠️ Abhi sirf .txt attach supported hai.", "ai");
    return;
  }
  if (file.size > 200 * 1024) {
    addMessage("⚠️ TXT 200KB se chhota rakho.", "ai");
    return;
  }

  const text = await file.text();
  selectedFileText = text;
  addMessage("✅ TXT attached. Ab message send karo.", "ai");
});

// ===== Voice =====
micBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return addMessage("❌ SpeechRecognition not supported. Use Chrome.", "ai");
  if (!window.isSecureContext) return addMessage("❌ Voice requires HTTPS.", "ai");

  const rec = new SR();
  rec.lang = "hi-IN";
  rec.interimResults = false;

  rec.onstart = () => addMessage("🎙️ Listening…", "ai");
  rec.onresult = (e) => {
    const t = e.results?.[0]?.[0]?.transcript || "";
    if (t.trim()) input.value = t.trim();
    input.focus();
  };
  rec.onerror = (e) => addMessage("❌ Mic error: " + (e.error || "unknown"), "ai");
  rec.onend = () => addMessage("✅ Voice stopped.", "ai");

  rec.start();
});

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
      selectedFileText = "";
      selectedFileName = "";
      fileInput.value = "";
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // If backend down
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      typing.remove();
      addMessage(❌ API error ${res.status}: ${raw || "Application failed to respond"}, "ai");
      return;
    }

    // If HTML came instead of JSON
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const raw = await res.text().catch(() => "");
      typing.remove();
      addMessage("❌ Server JSON nahi bhej raha (HTML aa raha). Backend fix needed.", "ai");
      console.log("NON-JSON:", raw);
      return;
    }

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage("❌ Network error: " + err.message, "ai");
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    updateHome();
    scrollBottom();
  }
}

updateHome();
