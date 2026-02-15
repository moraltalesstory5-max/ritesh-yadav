const chat = document.getElementById("chat");
const messages = document.getElementById("messages");
const home = document.getElementById("home");

const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

const newChatBtn = document.getElementById("newChatBtn");

let selectedFile = null;

function updateHomeVisibility() {
  // ✅ agar ek bhi message hai to home hide
  const hasMsgs = messages && messages.children.length > 0;
  if (home) home.style.display = hasMsgs ? "none" : "flex";
}

function scrollToBottom() {
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(text, who = "user") {
  const div = document.createElement("div");

  // ✅ IMPORTANT: class "ai" hi use karo (bot nahi)
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
  div.innerHTML = <span class="dots"><span></span><span></span><span></span></span>;
  messages.appendChild(div);

  updateHomeVisibility();
  scrollToBottom();
  return div;
}

function setBusy(isBusy) {
  sendBtn.disabled = isBusy;
  input.disabled = isBusy;
  uploadBtn.disabled = isBusy;
  micBtn.disabled = isBusy;
}

// ---- Events ----
sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Quick buttons fill text (optional)
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

// New chat
newChatBtn?.addEventListener("click", () => {
  messages.innerHTML = "";
  selectedFile = null;
  fileInput.value = "";
  updateHomeVisibility();
});

// Upload picker
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
  if (selectedFile) addMessage(📎 File selected: ${selectedFile.name}, "user");
});

// Voice input (Web Speech API)
micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addMessage("❌ Voice not supported in this browser.", "ai");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "en-IN"; // change to "hi-IN" if you want Hindi
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    const text = event.results[0][0].transcript;
    input.value = text;
    input.focus();
  };

  rec.onerror = (e) => addMessage("❌ Mic error: " + e.error, "ai");
  rec.start();
});

// ---- Main send ----
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // ✅ Home hide instantly after first message
  updateHomeVisibility();

  const typing = addTyping();
  setBusy(true);

  try {
    let res;

    // If file selected -> try multipart (backend support needed)
    if (selectedFile) {
      const form = new FormData();
      form.append("message", text);
      form.append("file", selectedFile);

      res = await fetch("https://ritesh-yadav-production-42f0.up.railway.app/api/chat", {
        method: "POST",
        body: form
      });

      selectedFile = null;
      fileInput.value = "";
    } else {
      res = await fetch("https://ritesh-yadav-production-42f0.up.railway.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
    }

    // Handle non-OK
    if (!res.ok) {
      let errText = "";
      try {
        const j = await res.json();
        errText = j.message || JSON.stringify(j);
      } catch {
        errText = await res.text();
      }
      typing.remove();
      addMessage(❌ API error ${res.status}: ${errText || "Server not responding"}, "ai");
      return;
    }

    // Safe JSON parse
    let data;
    try {
      data = await res.json();
    } catch {
      const raw = await res.text();
      typing.remove();
      addMessage("❌ Server returned non-JSON (HTML). Backend fix needed.", "ai");
      console.log("RAW:", raw);
      return;
    }

    typing.remove();
    addMessage(data.reply || "No reply", "ai");

    // ✅ After AI reply, ensure home stays hidden
    updateHomeVisibility();

  } catch (err) {
    typing.remove();
    addMessage("❌ Server error: " + err.message, "ai");
  } finally {
    setBusy(false);
  }
}

// Initial
updateHomeVisibility();
