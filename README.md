# 🛎️ ConciergeAI

A voice-first AI hotel concierge. Guests can type or **talk in real time** to ask about reservations, local recommendations and hotel services. Answers are grounded in live Google Search results.

## Features

- **Real-time voice conversation** over the Gemini Live API (native audio in/out, streamed with the Web Audio API)
- **Text chat** with selectable modes (fast replies vs. deeper "thinking" answers)
- **Search grounding** for up-to-date local info (restaurants, events, transport)
- **Image input**: guests can send a photo and ask about it

## Tech stack

React 19 · TypeScript · Vite · Gemini Live API (`gemini-2.5-flash-native-audio`) · Web Audio API

## Architecture

```
Mic ──► PCM encoder (utils/audio.ts) ──► Gemini Live session ──► audio chunks ──► playback queue
Text ─► geminiService.sendMessage ──► Gemini + googleSearch tool ──► ChatWindow
```

## Run locally

```bash
git clone https://github.com/trenCantSnipe/ConciergeAI.git && cd ConciergeAI
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey). The key stays in `.env.local`, which is git-ignored.
