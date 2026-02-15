const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

function addMessage(text, who = "user") {
const div = document.createElement("div");
div.className = "msg " + who;
div.innerText = text;
chat.appendChild(div);
chat.scrollTop = chat.scrollHeight;
}

sendBtn.onclick = sendMessage;
input.addEventListener("keydown", e => {
if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
const text = input.value.trim();
if (!text) return;

addMessage(text, "user");
input.value = "";

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

// 🔴 agar HTML aaya to yahin error hota tha  
const data = await res.json();  

addMessage(data.reply || "No reply", "bot");

} catch (err) {
addMessage("❌ Server error: " + err.message, "bot");
}
}
