const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// AI text formatting: paragraphs + line breaks + basic *bold*
function formatText(text) {
  if (!text) return "";

  let t = String(text).replace(/\r\n/g, "\n");
  t = escapeHtml(t);

  // *bold*
  t = t.replace(/\\(.+?)\\/g, "<b>$1</b>");

  // collapse too many blank lines
  t = t.replace(/\n{3,}/g, "\n\n");

  // split into paragraphs by blank line
  const parts = t.split(/\n\s*\n/g).map(p => p.trim()).filter(Boolean);

  // inside paragraph, single newline becomes <br>
  return parts.map(p => <p>${p.replace(/\n/g, "<br>")}</p>).join("");
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;

  // user plain, ai formatted
  if (who === "ai") div.innerHTML = formatText(text);
  else div.textContent = text;

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
  typing.style.opacity = "0.8";
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

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

    const data = await res.json();
    typing.remove();
    addMessage(data.reply || "No reply", "ai");
  } catch (err) {
    typing.remove();
    addMessage("❌ Server slow / error", "ai");
  }
