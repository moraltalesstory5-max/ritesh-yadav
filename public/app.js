const chat = document.getElementById("chat");
const inp = document.getElementById("inp");
const sendBtn = document.getElementById("sendBtn");
const startListen = document.getElementById("startListen");
const stopListen = document.getElementById("stopListen");
const micStatus = document.getElementById("micStatus");

function add(role, text){
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function send(text){
  const msg = (text || inp.value || "").trim();
  if(!msg) return;
  inp.value = "";
  add("user", msg);

  try{
    const r = await fetch("/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await r.json();
    add("ai", data.reply || "No reply");
  }catch(e){
    add("ai","Network/server error");
  }
}

sendBtn.onclick = ()=>send();
inp.addEventListener("keydown", e => { if(e.key==="Enter") send(); });

// ===== Wake word (needs click first) =====
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let listening = false;

function setMic(on){
  micStatus.textContent = on ? "Mic: ON" : "Mic: OFF";
}

function startRec(){
  if(!SR){ add("ai","SpeechRecognition not supported. Use Chrome."); return; }
  rec = new SR();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;

  rec.onstart = ()=> setMic(true);
  rec.onend = ()=> { if(listening) setTimeout(startRec, 300); else setMic(false); };
  rec.onerror = ()=> { if(listening) { try{rec.stop()}catch{} } };

  rec.onresult = (ev)=>{
    const last = ev.results[ev.results.length-1];
    const t = (last[0]?.transcript || "").trim();
    if(!t) return;
    if(t.toLowerCase().includes("ritesh")){
      const cmd = t.replace(/ritesh/ig,"").trim();
      if(cmd.length >= 2) send(cmd);
      else add("ai","Haan Ritesh boss 🙂 bolo kya kaam hai?");
    }
  };

  try{ rec.start(); }catch(e){}
}

startListen.onclick = async ()=>{
  try{
    // Force permission popup
    await navigator.mediaDevices.getUserMedia({ audio:true });
    listening = true;
    startRec();
    add("ai","Listening started. Ab bolo: “Ritesh …”");
  }catch(e){
    add("ai","Mic permission denied. Chrome site settings me Allow karo.");
  }
};

stopListen.onclick = ()=>{
  listening = false;
  try{ rec && rec.stop(); }catch(e){}
  setMic(false);
  add("ai","Listening stopped.");
};

add("ai","Haan Ritesh boss 🙂 Type karo ya Start click karke “Ritesh …” bolo.");
