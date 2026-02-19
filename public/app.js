const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.style.whiteSpace = "pre-wrap";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function hideHome() {
  if (home) home.style.display = "none";
}

let busy = false;

async function sendMessage() {
  const text = input.value.trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;
  hideHome();
  addMessage(text, "user");
  input.value = "";

  // Placeholder for AI reply
  const aiMsgDiv = addMessage("...", "ai");
  aiMsgDiv.textContent = ""; 

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error("Server error");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      aiMsgDiv.textContent += chunk; // Shabd judte jayenge
      chat.scrollTop = chat.scrollHeight;
    }

  } catch (err) {
    aiMsgDiv.textContent = "❌ Error: Connection slow ya server down hai.";
  } finally {
    busy = false;
    sendBtn.disabled = false;
  }
}

sendBtn.onclick = sendMessage;
input.onkeydown = (e) => { if (e.key === "Enter") sendMessage(); };
