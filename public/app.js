const API_URL = "https://ritesh-yadav-production-42f0.up.railway.app/api/chat";

const chat = document.getElementById("chat");
const messages = document.getElementById("messages");
const home = document.getElementById("home");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

const micBtn = document.getElementById("micBtn");

const newBtn = document.getElementById("newBtn");
const helpBtn = document.getElementById("helpBtn");
const menuBtn = document.getElementById("menuBtn");

const dot = document.getElementById("dot");

let currentMode = "chat";
let isSending = false;

// ---------- UI helpers ----------
function scrollToBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function hideHome() {
  if (home) home.style.display = "none";
}

function showHome() {
  if (home) home.style.display = "";
}

function setOnline(isOnline) {
  if (!dot) return;
  dot.classList.toggle("offline", !isOnline);
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.innerHTML = <span class="dots"><span></span><span></span><span></span></span>;
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

function setSending(state) {
  isSending = state;
  sendBtn.disabled = state;
  uploadBtn.disabled = state;
  micBtn.disabled = state;
}

// ---------- Quick buttons (Home screen) ----------
document.querySelectorAll(".quick").forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode || "chat";
    const preset = btn.dataset.text || "";
    input.value = preset;
    input.focus();
    hideHome();
  });
});

// ---------- Send ----------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage(extraPayload = {}) {
  if (isSending) return;

  const text = (input.value || "").trim();
  if (!text && !extraPayload.file) return;

  hideHome();
  setSending(true);

  if (text) addMessage(text, "user");
  input.value = "";

  const typingEl = addTyping();

  try {
    // payload
    const payload = {
      message: text || "",
      mode: currentMode,
      ...extraPayload
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // if backend fails
    if (!res.ok) {
      const bodyText = await safeReadText(res);
      typingEl.remove();
      setOnline(false);

      addMessage(
        ❌ API error ${res.status}\n${bodyText ? bodyText.slice(0, 180) : "No response body"},
        "ai"
      );
      setSending(false);
      return;
    }

    // JSON check (fix for <!DOCTYPE html> not valid JSON)
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    let data;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const bodyText = await safeReadText(res);
      typingEl.remove();
      setOnline(false);
      addMessage(❌ Server returned non-JSON.\n${bodyText.slice(0, 180)}, "ai");
      setSending(false);
      return;
    }

    typingEl.remove();
    setOnline(true);

    const reply = data.reply || data.message || data.output || "";
    addMessage(reply ? reply : "⚠️ No reply from server", "ai");

  } catch (err) {
    typingEl.remove();
    setOnline(false);
    addMessage("❌ Network/Server error: " + err.message, "ai");
  } finally {
   …
