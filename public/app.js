const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

let busy = false;

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.style.whiteSpace = "pre-wrap";
  div.textContent = String(text ?? "");
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function hideHome() {
  if (home) home.style.display = "none";
}

sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll(".quick").forEach((btn) => {
  btn.onclick = () => {
    input.value = btn.dataset.text || "";
    sendMessage();
  };
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;

  hideHome();
  addMessage(text, "user");
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.textContent = "…";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(
      "https://ritesh-yadav-production-42f0.up.railway.app/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal
      }
    );

    clearTimeout(timer);

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json().catch(() => ({}));

    typing.remove();
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage(err?.name === "AbortError" ? "❌ Timeout" : "❌ Server error", "ai");
  } finally {
    busy = false;
    sendBtn.disabled = false;
  }
}
```0
