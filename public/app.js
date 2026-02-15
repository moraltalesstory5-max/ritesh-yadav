const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

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
// 📎 Upload button
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  hideHome();
  addMessage(📎 File selected: ${file.name}, "user");
  addMessage("⚠️ Upload backend abhi connect nahi hai.", "ai");

  fileInput.value = "";
});
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
