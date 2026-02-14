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

function setStatus(ok) {
  statusEl.textContent = ok ? "Online" : "Offline";
  statusEl.classList.toggle("on", ok);
}

async function ping() {
  try {
    // cache-bust to avoid stale cached response
    const r = await fetch("/health?t=" + Date.now(), { cache: "no-store" });
    setStatus(r.ok);
  } catch {
    setStatus(false);
  }
}

// ✅ Better ping strategy: less load + stop when tab hidden
let pingTimer = null;
function startPing() {
  if (pingTimer) return;
  ping(); // immediate once
  pingTimer = setInterval(ping, 30000); // ✅ 30 seconds (not 3 sec)
}
function stopPing() {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPing();
  else startPing();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMsg("user", text);

  sendBtn.disabled = true;
  const typing = addMsg("ai", "Typing...");

  const startedAt = Date.now();

  // ✅ Timeout protection
  const controller = new AbortController();
  const timeoutMs = 25000; // 25 sec
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    });

    // If backend sends non-200, handle nicely
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(HTTP ${r.status} ${t || ""}.trim());
    }

    const data = await r.json();
    const took = ((Date.now() - startedAt) / 1000).toFixed(1);
    typing.textContent = (data.reply || "Ritesh boss, koi reply nahi aaya.") + `  (${took}s)`;
  } catch (e) {
    const took = ((Date.now() - startedAt) / 1000).toFixed(1);
    if (e?.name === "AbortError") {
      typing.textContent = Ritesh boss, reply slow hai (timeout ${timeoutMs / 1000}s). (${took}s);
    } else {
      typing.textContent = "Ritesh boss, network/server error: " + (e?.message || e) + `  (${took}s)`;
    }
  } finally {
    clearTimeout(timer);
    sendBtn.disabled = false;
    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Start ping
startPing();
