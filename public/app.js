const chat = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const home = document.getElementById("home");

// ✅ FAST: same server route
const API_URL = "/api/chat";

let isSending = false;

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function hideHome() {
  if (home) home.style.display = "none";
}

function setSending(state) {
  isSending = state;
  sendBtn.disabled = state;
  input.disabled = state;
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ✅ Quick buttons: only fill input (not auto send)
document.querySelectorAll(".quick").forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.text || "";
    input.focus();
    hideHome();
  });
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  if (isSending) return; // ✅ prevent double send

  hideHome();
  addMessage(text, "user");
  input.value = "";

  setSending(true);

  // ✅ typing indicator
  const typing = addMessage("...", "ai");

  // ✅ timeout protection
  const controller = new AbortController();
  const timeoutMs = 20000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startedAt = Date.now();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      signal: controller.signal,
      cache: "no-store",
    });

    // handle non-200
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(HTTP ${res.status} ${t ? ("- " + t.slice(0, 80)) : ""}.trim());
    }

    // handle non-json (like HTML)
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      throw new Error("Server JSON nahi bhej raha. " + t.slice(0, 80));
    }

    const data = await res.json();
    const took = ((Date.now() - startedAt) / 1000).toFixed(1);

    typing.remove();
    addMessage((data.reply || "No reply") + `  (${took}s)`, "ai");
  } catch (err) {
    typing.remove();
    const took = ((Date.now() - startedAt) / 1000).toFixed(1);

    if (err?.name === "AbortError") {
      addMessage(⏳ Reply slow hai (timeout ${timeoutMs / 1000}s). (${took}s), "ai");
    } else {
      addMessage("❌ Server error: " + (err?.message || err) + `  (${took}s)`, "ai");
    }
  } finally {
    clearTimeout(timer);
    setSending(false);
    input.focus();
  }
}
