const chat = document.getElementById("chat");
const inp = document.getElementById("inp");
const sendBtn = document.getElementById("sendBtn");
const startListen = document.getElementById("startListen");
const stopListen = document.getElementById("stopListen");
const micStatus = document.getElementById("micStatus");

function addMsg(role, text){
  const row = document.createElement("div");
  row.className = row ${role};
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;
  row.appendChild(b);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function setTyping(on){
  let el = document.getElementById("typing");
  if(on){
    if(!el){
      el = document.createElement("div");
      el.id = "typing";
      el.className = "typing";
      el.textContent = "Ritesh.ai is typing…";
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }
  } else {
    if(el) el.remove();
  }
}

// ✅ Female Indian voice (if available)
function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 1.0;
    u.pitch = 0.95;

    // voices load async sometimes
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      const v =
        voices.find(v => /hi-IN/i.test(v.lang) && /female|woman|Hindi|हिंदी|Google/i.test(v.name)) ||
        voices.find(v => /hi-IN/i.test(v.lang)) ||
        voices.find(v => /en-IN/i.test(v.lang));
      if(v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };

    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = pick;
      setTimeout(pick, 300);
    } else {
      pick();
    }
  }catch(e){}
}

async function sendMessage(msg){
  const text = (msg || inp.value || "").trim();
  if(!text) return;

  inp.value = "";
  addMsg("user", text);
  setTyping(true);

  try{
    const r = await fetch("/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await r.json().catch(()=> ({}));
    const reply = data?.reply || "Ritesh boss, reply nahi aaya 😕";
    setTyping(false);
    addMsg("ai", reply);
    speak(reply);
  }catch(e){
    setTyping(false);
    addMsg("ai","Ritesh boss, network/server error.");
  }
}

sendBtn.addEventListener("click", ()=>sendMessage());
inp.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendMessage(); });

// =======================
// ✅ Wake word listening
// NOTE: first user gesture needed.
// =======================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let listening = false;
let lastSentAt = 0;

function setMic(on){
  micStatus.textContent = on ? "Mic: ON (Say: Ritesh …)" : "Mic: OFF";
  micStatus.className = on ? "status on" : "status";
}

function startRec(){
  if(!SpeechRecognition){
    addMsg("ai","Ritesh boss, is browser me Speech Recognition support nahi hai. Chrome use karo.");
    return;
  }

  if(rec){
    try{ rec.stop(); }catch(e){}
    rec = null;
  }

  rec = new SpeechRecognition();
  rec.lang = "en-IN";      // Hinglish detect
  rec.continuous = true;
  rec.interimResults = true;

  rec.onstart = ()=> setMic(true);

  rec.onresult = (event)=>{
    const last = event.results[event.results.length - 1];
    const text = (last[0]?.transcript || "").trim();
    if(!text) return;

    const low = text.toLowerCase();

    if(low.includes("ritesh")){
      // prevent spam sends
      const now = Date.now();
      if (now - lastSentAt < 1500) return;

      const cmd = text.replace(/ritesh/ig,"").trim();

      if(cmd.length >= 2){
        lastSentAt = now;
        sendMessage(cmd);
      } else {
        addMsg("ai","Haan Ritesh boss 🙂 bolo kya kaam …
