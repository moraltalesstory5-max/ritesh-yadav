const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const micBtn = document.getElementById("micBtn");

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

sendBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);

  // demo AI reply
  setTimeout(() => {
    addMsg("ai", "Ritesh boss, ye demo reply hai 🙂");
  }, 700);
};

// 📎 File upload
uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (file) {
    addMsg("user", 📎 File uploaded: ${file.name});
  }
};

// 🎙️ Voice input
let recognition;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;

  micBtn.onclick = () => recognition.start();

  recognition.onresult = (e) => {
    input.value = e.results[0][0].transcript;
  };
} else {
  micBtn.onclick = () => alert("Voice not supported on this browser");
}
