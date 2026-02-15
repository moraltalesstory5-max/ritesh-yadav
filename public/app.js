const chat = document.getElementById("chat");
const home = document.getElementById("home");
const messages = document.getElementById("messages");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

let selectedMode = "chat";

function updateHome() {
  home.style.display = messages.children.length ? "none" : "flex";
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + (who === "bot" ? "ai" : who);
  div.textContent = text;
  messages.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  updateHome();
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "msg ai typing";
  div.textContent = "…";
  messages.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  updateHome();
  return div;
}

// Quick buttons
document.querySelectorAll(".quick").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedMode = btn.dataset.mode;

    const map = {
      image: "Create an image prompt for: ",
      write: "Help me write: ",
      summary: "Summarize this: ",
      surprise: "Surprise me with something fun."
    };

    input.value = map[selectedMode] || "";
    input.focus();
  });
});

// Send
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  sendBtn.disabled = true;

  const typing = addTyping();

  try {
    const res = await fetch("https://ritesh-yadav-production-42f0.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, mode: selectedMode })
    });

    // 🔥 अगर server HTML भेज दे तो ये catch में जाएगा
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await res.text();
      throw new Error("Server returned non-JSON (maybe 502/HTML).");
    }

    const data = await res.json();

    typing.remove();
    addMessage(data.reply || "No reply", "bot");
  } catch (err) {
    typing.remove();
    addMessage("❌ Server error: " + err.message, "bot");
  } finally {
    sendBtn.disabled = false;
  }
}

// Upload button
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  addMessage(📎 Uploaded: ${file.name}, "user");

  // अभी तुमhare backend me file-upload endpoint नहीं दिख रहा
  // इसलिए सिर्फ UI में दिखा रहे हैं
  addMessage("⚠️ Upload feature backend me add karna padega (/api/upload).", "bot");

  fileInput.value = "";
});

// Voice button (browser speech-to-text)
micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    addMessage("❌ Voice input not supported in this browser.", "bot");
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = "en-IN";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  addMessage("🎙️ Listening...", "bot");

  recog.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    input.value = spoken;
    input.focus();
  };

  recog.onerror = (e) => {
    addMessage("❌ Mic error: " + e.error, "bot");
  };

  recog.start();
});

updateHome();
