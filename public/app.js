const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

let typingEl = null;

/* MESSAGE ADD */
function addMessage(text, who = "user") {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* TYPING INDICATOR */
function showTyping() {
  if (typingEl) return;
  typingEl = document.createElement("div");
  typingEl.className = "msg ai";
  typingEl.innerText = "...";
  chat.appendChild(typingEl);
  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  if (!typingEl) return;
  typingEl.remove();
  typingEl = null;
}

/* SEND EVENTS */
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* MAIN SEND FUNCTION */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;

  showTyping();

  try {
    const res = await fetch(
      "https://ritesh-yadav-production-42f0.up.railway.app/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      }
    );

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Server JSON return nahi kar raha");
    }

    hideTyping();

    addMessage(data.reply || "No reply", "ai");

  } catch (err) {
    hideTyping();
    addMessage("❌ " + err.message, "ai");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}
