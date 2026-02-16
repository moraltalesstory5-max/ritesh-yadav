const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");
const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  // sirf test ke liye — confirm karega upload button kaam kar raha
  input.value = Uploaded: ${file.name} (${Math.round(file.size/1024)} KB);

  fileInput.value = "";
});

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function hideHome() {
  if (home) home.style.display = "none";
}

sendBtn.onclick = sendMessage;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

document.querySelectorAll(".quick").forEach(btn => {
  btn.onclick = () => {
    input.value = btn.dataset.text;
    sendMessage();
  };
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  hideHome();
  addMessage(text, "user");
  input.value = "";

  // typing indicator
  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.textContent = "...";
  chat.appendChild(typing);

  try {
    const res = await fetch(
      "https://ritesh-yadav-production-42f0.up.railway.app/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      }
    );

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");

  } catch (err) {
    typing.remove();
    addMessage("❌ Server error", "ai");
  }
}
micBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SR) {
    alert("Voice not supported. Chrome use karo.");
    return;
  }

  const rec = new SR();
  rec.lang = "hi-IN"; // Hindi / Hinglish
  rec.interimResults = false;

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
    input.focus();
  };

  rec.onerror = (e) => {
    alert("Mic error: " + (e.error || "unknown"));
  };

  rec.start();
});
