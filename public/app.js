const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;

  // ✅ paragraph + line breaks sahi dikhेंगे
  div.style.whiteSpace = "pre-wrap";
  div.textContent = String(text || "");

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

// ✅ request spam रोकने के लिए
let busy = false;

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
  typing.style.whiteSpace = "pre-wrap";
  typing.textContent = "Typing…";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  // ✅ “late feel” कम करने के लिए live dots
  let dots = 0;
  const dotTimer = setInterval(() => {
    dots = (dots + 1) % 4;
    typing.textContent = "Typing" + ".".repeat(dots);
  }, 350);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

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

    const data = await res.json().catch(() => ({}));

    clearInterval(dotTimer);
    typing.remove();

    // ✅ server se markdown aa raha ho to client-side clean
    let reply = String(data.reply || "No reply");
    reply = reply
      .replace(/\\/g, "")      // *bold* हटाओ
      .replace(/#{1,6}\s?/g, "") // headings हटाओ
      .replace(/\n{3,}/g, "\n\n")
      .trim();
reply = String(reply || "")
  .replace(/#{1,6}\s?/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

// ✅ Short mode settings
const MAX_LINES = 6;     // max 6 lines
const MAX_CHARS = 320;   // max 320 characters

// 1) limit lines
reply = reply.split("\n").slice(0, MAX_LINES).join("\n").trim();

// 2) limit characters
if (reply.length > MAX_CHARS) {
  reply = reply.slice(0, MAX_CHARS).trim() + "…";
}
    addMessage(reply, "ai");
  } catch (err) {
    clearInterval(dotTimer);
    typing.remove();
    addMessage("❌ Server slow / error. Try again.", "ai");
  } finally {
    busy = false;
    sendBtn.disabled = false;
  }
}
