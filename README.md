# Ritesh.ai (REAL AI - Gemini)

Ye project local browser me chat UI chalata hai aur backend Node/Express se **Gemini API** call karta hai.
Isme "repeat" wala mock nahi hai — real AI answer dega.

## Requirements
- Node.js 18+ (tumhare screenshot me v18.20.8 OK)
- Internet ON

## Setup (Windows CMD)
1) Zip extract karo: `C:\ritesh-ai-real-gemini`
2) CMD open karo (Start -> cmd)
3) Run:

```bat
cd /d C:\ritesh-ai-real-gemini
npm install
```

4) `.env` file banao isi folder me, aur API key paste karo:

```
GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
```

5) Start:

```bat
npm start
```

6) Browser:
- http://localhost:3000

## Common Errors
- **API key not valid**: new key banao, sahi paste karo, server restart karo.
- **PORT busy**: `.env` me `PORT=3001` add karo.
