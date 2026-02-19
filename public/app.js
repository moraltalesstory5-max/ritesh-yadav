async function sendMessage() {
  const text = input.value.trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;
  hideHome();
  addMessage(text, "user");
  input.value = "";

  // Pehle ek khali AI bubble banao
  const aiMsgDiv = addMessage("", "ai");
  aiMsgDiv.textContent = "typing...";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error("Server slow/down");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    aiMsgDiv.textContent = ""; // "typing..." hatao

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      aiMsgDiv.textContent += chunk; // Shabd turant judenge
      chat.scrollTop = chat.scrollHeight;
    }

  } catch (err) {
    aiMsgDiv.textContent = "❌ Error: " + err.message;
  } finally {
    busy = false;
    sendBtn.disabled = false;
  }
}
