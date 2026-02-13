const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");

function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + role;
  wrap.textContent = text;
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return wrap;
}

async function ping() {
  try {
    const r = await fetch("/health");
    if (r.ok) {
      statusEl.textContent = "Online";
      statusEl.classList.add("on");
    } else throw new Error();
  } catch {
    statusEl.textContent = "Offline";
    statusEl.classList.remove("on");
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);

  sendBtn.disabled = true;
  const typing = addMsg("ai", "Typing...");

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await r.json();
    typing.textContent = data.reply || "Ritesh boss, koi reply nahi aaya.";
  } catch (e) {
    typing.textContent = "Ritesh boss, network/server error: " + (e?.message || e);
  } finally {
    sendBtn.disabled = false;
    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

addMsg("ai", "Ritesh boss, welcome! Ab kuch bhi pucho — main Gemini se real answer dunga. ✅");
ping();
setInterval(ping, 3000);
