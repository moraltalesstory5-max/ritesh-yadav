const chatWrap = document.getElementById("chat");
const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

// ✅ message add
function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + (who === "bot" ? "ai" : who);
  div.textContent = text;
  messages.appendChild(div);
  chatWrap.scrollTop = chatWrap.scrollHeight;
}

// ✅ hide home once chat starts
function hideHome() {
  if (home) home.style.display = "none";
}

// ✅ show home if no messages
function maybeShowHome() {
  if (!home) return;
  if (messages.children.length === 0) home.style.display = "";
}

// ✅ typing bubble
function addTyping() {
  const t = document.createElement("div");
  t.className = "msg ai";
  t.textContent = "...";
  messages.appendChild(t);
  chatWrap.scrollTop = chatWrap.scrollHeight;
  return t;
}

// ✅ send
async function sendMessage(textFromQuick = null) {
  const text = (textFromQuick ?? input.value).trim();
  if (!text) return;

  hideHome();
  addMessage(text, "user");
  input.value = "";

  // disable send while waiting
  sendBtn.disabled = true;

  const typing = addTyping();

  try {
    const res = await fetch("https://ritesh-yadav-production-42f0.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    typing.remove();

    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage("❌ Server error: " + err.message, "ai");
  } finally {
    sendBtn.disabled = false;
  }
}

// events
sendBtn.addEventListener("click", () => sendMessage());
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ✅ quick buttons
document.querySelectorAll(".quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    sendMessage(btn.dataset.text || "");
  });
});

// ✅ Upload button working (opens file picker)
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

// ✅ file selected (demo: show file name in chat)
// NOTE: actual file upload to server needs backend endpoint.
// abhi sirf frontend working proof hai.
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  hideHome();
  addMessage(📎 Selected: ${file.name} (${Math.round(file.size / 1024)} KB), "user");
  fileInput.value = "";
});

// ✅ Mic button working (Speech to Text)
micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    addMessage("❌ Voice input not supported in this browser.", "ai");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "hi-IN";
  rec.interimResults = false;

  rec.onstart = () => {
    micBtn.textContent = "🛑";
  };

  rec.onend = () => {
    micBtn.textContent = "🎙️";
  };

  rec.onerror = (e) => {
    addMessage("❌ Mic error: " + (e.error || "unknown"), "ai");
  };

  rec.onresult = (e) => {
    const said = e.results?.[0]?.[0]?.transcript || "";
    input.value = said;
    // optional auto send:
    // sendMessage();
  };

  rec.start();
});

// on load
maybeShowHome();
