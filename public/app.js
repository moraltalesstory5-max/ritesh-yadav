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
}

/* ---------------- FILE UPLOAD ---------------- */
if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    addMsg(
      "user",
      "Uploading: " + file.name + " (" + Math.round(file.size / 1024) + " KB)"
    );

    try {
      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch("/api/upload", {
        method: "POST",
        body: fd
      });

      if (!r.ok) throw new Error("Upload failed");

      const data = await r.json();
      addMsg("ai", "Uploaded: " + (data.originalName || file.name));
    } catch (e) {
      addMsg("ai", "Upload error: " + e.message);
    }

    fileInput.value = "";
  });
}

/* ---------------- VOICE ---------------- */
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMsg("ai", "Voice not supported");
    return;
  }

  const rec = new SR();
  rec.lang = "hi-IN";

  rec.onresult = (e) => {
    input.value = e.results[0][0].transcript;
  };

  rec.start();
}

if (micBtn) micBtn.addEventListener("click", startVoice);

/* ---------------- CHAT ---------------- */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMsg("user", text);
  sendBtn.disabled = true;

  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.textContent = "Typing...";
  chat.appendChild(typing);

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await r.json();
    typing.textContent = data.reply || "No reply";
  } catch (e) {
    typing.textContent = "Error";
  }

  sendBtn.disabled = false;
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
