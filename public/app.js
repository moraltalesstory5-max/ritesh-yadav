const chat = document.getElementById("chat");
const home = document.getElementById("home");
const messages = document.getElementById("messages");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

const micBtn = document.getElementById("micBtn");

const API_URL = "https://ritesh-yadav-production-42f0.up.railway.app/api/chat";

function showHomeIfEmpty() {
  const hasMsgs = messages.children.length > 0;
  home.style.display = hasMsgs ? "none" : "flex";
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + who; // who: user | ai
  div.innerText = text;
  messages.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  showHomeIfEmpty();
}

async function safeReadJson(res) {
  // अगर server HTML भेज दे तो JSON parse में error आता है
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const t = await res.text();
    throw new Error("Server JSON nahi bhej raha (HTML/other aaya). Status: " + res.status);
  }
  return await res.json();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      // server 4xx/5xx
      let extra = "";
      try {
        const maybeText = await res.text();
        extra = maybeText ? (" | " + maybeText.slice(0, 120)) : "";
      } catch (_) {}
      throw new Error("API error " + res.status + extra);
    }

    const data = await safeReadJson(res);
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    addMessage("❌ " + err.message, "ai");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.onclick = sendMessage;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Quick buttons (home)
document.querySelectorAll(".quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.getAttribute("data-prompt") || "";
    input.value = prompt;
    input.focus();
  });
});

// Upload button (basic)
uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  addMessage("📎 Selected file: " + f.name, "user");
  // yaha file upload logic add kar sakte ho (backend support ho to)
  fileInput.value = "";
});

// Mic button (simple: browser speech recognition if available)
micBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMessage("🎙️ Voice input not supported in this browser.", "ai");
    return;
  }
  const rec = new SR();
  rec.lang = "en-IN";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    const said = event.results?.[0]?.[0]?.transcript || "";
    if (said) input.value = said;
    input.focus();
  };
  rec.onerror = (e) => addMessage("🎙️ Mic error: " + (e.error || "unknown"), "ai");

  rec.start();
});

// top buttons (optional behaviors)
document.getElementById("newChatBtn").addEventListener("click", () => {
  messages.innerHTML = "";
  showHomeIfEmpty();
  input.value = "";
  input.focus();
});

document.getElementById("menuBtn").addEventListener("click", () => {
  addMessage("☰ Menu (abhi blank).", "ai");
});

document.getElementById("helpBtn").addEventListener("click", () => {
  addMessage("Tip: Message likho aur ➤ dabao. Quick buttons se prompt fill hota hai.", "ai");
});

showHomeIfEmpty();
