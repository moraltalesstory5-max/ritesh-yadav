const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;

  // Preserve line breaks safely
  div.style.whiteSpace = "pre-wrap";
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

  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.style.whiteSpace = "pre-wrap";
  typing.textContent = "...";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("HTTP " + res.status + " " + t);
    }

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage("❌ Server slow / error\n" + (err?.message || ""), "ai");
  }
