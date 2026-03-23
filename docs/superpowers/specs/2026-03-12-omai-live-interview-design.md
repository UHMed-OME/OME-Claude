# OMAI Live Interview Session — Design Spec
**Date:** 2026-03-12
**Project:** OMAI (Office of Medical AI) — JABSOM / OME
**Scope:** MVP — Live Interview Session (React web app, Electron-ready)

---

## 1. Overview

A React/TypeScript web application that enables JABSOM medical students to practice residency interviews with an AI-powered digital human avatar. The app uses NavTalk for real-time avatar streaming, Claude (or any OpenAI-compatible LLM) as the interview brain, and ElevenLabs for high-quality TTS voice.

The MVP covers a single flow: pre-session setup → live interview → post-session transcript.

**Deployment target:** Electron desktop app (primary). All sensitive API keys live in the Electron main process and are injected into the renderer via a secure preload script — they are never exposed in a public web bundle.

---

## 2. User Flow

```
1. Pre-Session Screen
   └── Select residency specialty (default: Internal Medicine)
   └── Select interview mode: Behavioral | Clinical | Mixed
   └── "Start Interview" button

2. Live Session Screen
   └── NavTalk avatar video (doctor, full or half-screen)
   └── Student webcam (small self-view, bottom corner)
   └── Status indicator: Connecting / Listening / Speaking / Thinking / Error / Reconnecting
   └── Mute toggle + End Interview button
   └── No transcript shown during session

3. Post-Session Screen
   └── Full turn-by-turn transcript
   └── Session metadata (specialty, mode, duration)
   └── "Start New Interview" button
```

---

## 3. Architecture

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (Vite) |
| Styling | Tailwind CSS |
| AI Client (Claude) | `@anthropic-ai/sdk` — direct Anthropic API |
| AI Client (OAI-compatible) | `openai` npm package — configurable baseURL (LM Studio, OpenAI, OpenRouter) |
| Avatar | NavTalk Real-time Digital Human API (WebRTC + WebSocket) |
| TTS | ElevenLabs (primary); QwenTTS (stubbed for future) |
| Camera | `getUserMedia()` + WebRTC video track injection |
| Electron | Vite renderer + Electron main process; keys injected via preload |

**Electron security settings (required):**
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- All API keys passed from main process → renderer via `contextBridge` preload
- No Node.js APIs used in the renderer; all sensitive config flows through preload

### 3.2 Who Makes the LLM Calls?

**During a live session: NavTalk's backend makes all LLM API calls.** The app configures which provider/endpoint NavTalk should use via `realtime.input_config`. NavTalk's servers connect outbound to the LLM provider.

Consequence: `lib/ai/client.ts` is **not invoked during live sessions**. It exists for:
- Post-session summary generation (future scope)
- Any pre/post-session AI calls outside of NavTalk

**LM Studio caveat:** NavTalk is a cloud service. Its backend cannot reach `localhost:1234`. LM Studio support requires either (a) a publicly-reachable tunnel (e.g., ngrok) or (b) a locally-hosted NavTalk instance. For MVP, document LM Studio as local-dev-only with a tunnel required.

**AI provider configuration sent to NavTalk in `realtime.input_config`:**

| Provider | NavTalk config | Notes |
|---|---|---|
| Claude via OpenRouter | `baseURL: https://openrouter.ai/api/v1`, model: `anthropic/claude-opus-4-5` | OpenRouter is OAI-compatible; proxies to Claude |
| OpenAI | `baseURL: https://api.openai.com/v1` | Standard |
| LM Studio | `baseURL: http://localhost:1234/v1` | Dev only; requires public tunnel for NavTalk |

> Anthropic's API is **not** OpenAI-compatible (different auth headers, versioning). Route Claude through OpenRouter for NavTalk integration. `@anthropic-ai/sdk` is only used for direct API calls outside of NavTalk sessions.

### 3.3 NavTalk Integration

**Provider:** `OpenAIRealtime` (NavTalk provider string — to be confirmed against NavTalk dashboard/docs)
**WebSocket endpoint:** `wss://transfer.navtalk.ai/wss/v2/realtime-chat`
**Auth params:** `?license=NAVTALK_API_KEY&character=navtalk.Lauren`

**Connection sequence (strict order):**
```
1. Open WebSocket
2. Receive `conversation.connected.success`
   → extract sessionId + iceServers
   → create RTCPeerConnection with iceServers
3. Send `realtime.input_config` (system prompt + tools) ← after connected.success, NOT on onopen
4. WebRTC offer/answer signaling via same WebSocket (v2 unified)
5. Add student webcam video track via peerConnection.addTrack()
6. Receive avatar video stream via ontrack → render in <video> element
7. Receive `REALTIME_SESSION_CREATED` → session initialized
8. Receive `REALTIME_SESSION_UPDATED` → ready for audio input
```

> **Note:** NavTalk WebSocket event names (`conversation.connected.success`, `realtime.input_config`,
> `REALTIME_SESSION_CREATED`, `REALTIME_SESSION_UPDATED`) are sourced from NavTalk's published
> documentation. Verify against the NavTalk dashboard API reference before implementing
> `lib/navtalk/events.ts`.

**Camera recognition (both run simultaneously):**
- **WebRTC video track** — `peerConnection.addTrack()` with student webcam stream; NavTalk's vision model uses this for real-time visual context (~50ms latency)
- **Periodic snapshots** — canvas captures webcam frame every 2s → base64 JPEG → `realtime.input_image` via WebSocket; used as explicit image input to the LLM for function calling context

Both methods are active simultaneously: WebRTC for NavTalk's continuous vision pipeline, snapshots for discrete LLM function call inputs.

**TTS → Avatar lip-sync pipeline:**
```
Claude/NavTalk text response
  → ElevenLabs.synthesizeStream() → AsyncIterable<Uint8Array> (PCM16 chunks)
  → Web Audio scheduling:
      AudioContext.createBufferSource() per chunk
      → decoded into AudioBuffer
      → scheduled via AudioBufferSourceNode.start(offset)
      → routed to MediaStreamDestination node
  → MediaStreamDestination.stream
  → RTCPeerConnection.addTrack() (outbound audio track to NavTalk)
  → NavTalk drives avatar lip-sync from this injected audio stream
```

The key Web Audio wiring: create an `AudioContext` at session start with a single `MediaStreamDestination`. For each PCM16 chunk from ElevenLabs, decode into an `AudioBuffer`, create an `AudioBufferSourceNode`, connect to the destination, and schedule with a running playhead offset to avoid gaps. The `MediaStreamDestination.stream` feeds directly into the WebRTC peer connection.

NavTalk's `OpenAIRealtime` provider supports external audio injection for lip-sync — confirm the specific track/stream configuration with NavTalk API docs before implementing `lib/tts/`.

**Transcript capture:**
NavTalk emits turn events over WebSocket. Exact event names TBD from NavTalk API reference — likely `conversation.turn.user` and `conversation.turn.assistant` or equivalent. The `useTranscript` hook listens for these and appends to state + writes to `localStorage` on each turn (crash recovery).

**Session termination:**
- Close WebRTC peer connection
- Close WebSocket
- Release camera/mic via `track.stop()`
- Flush final transcript to `localStorage`

**Error states:**
- WebSocket disconnect → status: `Error`, show reconnect modal
- WebRTC ICE failure → status: `Reconnecting`, auto-retry once
- NavTalk session error event → status: `Error`, surface message to student

### 3.4 TTS Layer

Abstracted behind a provider interface supporting both buffered and streaming synthesis:

```typescript
interface TTSProvider {
  // Buffered — full audio before playback (simpler, higher latency)
  synthesize(text: string): Promise<ArrayBuffer>
  // Streaming — chunked audio for lower latency on long responses
  synthesizeStream(text: string): AsyncIterable<Uint8Array>
}
```

- `ElevenLabsTTS` — implements both methods; use `synthesizeStream` for interview responses to minimize lag
- `QwenTTS` — stub class; `synthesize` and `synthesizeStream` throw `NotImplementedError` with a message pointing to future implementation

### 3.5 Function Calling

Defined in `lib/ai/tools.ts`, sent to NavTalk in `realtime.input_config` on session start:

```typescript
// Pseudocode — actual implementation in lib/ai/tools.ts must emit valid JSON Schema
// (type: "string", enum: [...]) as required by the OpenAI function calling API format.
tools: [
  {
    name: "get_question",
    description: "Retrieve the next interview question for the current specialty and mode",
    parameters: {
      // JSON Schema at runtime:
      // specialty: { type: "string", enum: ["internal-medicine", "general-surgery", ...] }
      // mode: { type: "string", enum: ["behavioral", "clinical"] }
      // questionIndex: { type: "number" }
      specialty: Specialty,
      mode: Exclude<InterviewMode, 'mixed'>,
      questionIndex: number
    }
  }
]
```

Question bank is a local TypeScript file — no external DB for MVP.

---

## 4. Project Structure

```
omai-interview/
├── electron/
│   ├── main.ts                    ← Electron main process
│   └── preload.ts                 ← contextBridge: exposes env vars to renderer
├── src/
│   ├── components/
│   │   ├── PreSession/
│   │   │   ├── SpecialtySelector.tsx
│   │   │   └── ModeSelector.tsx
│   │   ├── LiveSession/
│   │   │   ├── AvatarView.tsx         ← NavTalk <video> + WebRTC
│   │   │   ├── StudentCamera.tsx      ← self-view + webcam track injection
│   │   │   ├── SessionControls.tsx    ← mute, end
│   │   │   └── StatusIndicator.tsx    ← Connecting/Listening/Speaking/Thinking/Error/Reconnecting
│   │   └── PostSession/
│   │       ├── TranscriptView.tsx
│   │       └── SessionSummary.tsx
│   ├── lib/
│   │   ├── navtalk/
│   │   │   ├── session.ts             ← WebSocket + WebRTC lifecycle (strict init order)
│   │   │   ├── events.ts              ← typed event handlers (verify names vs. NavTalk docs)
│   │   │   └── camera.ts             ← getUserMedia + track injection + snapshot loop
│   │   ├── ai/
│   │   │   ├── client.ts              ← provider router: Anthropic SDK vs. OpenAI SDK
│   │   │   ├── prompts.ts             ← system prompt builder per specialty + mode
│   │   │   ├── questionBank.ts        ← local question data by specialty + mode
│   │   │   └── tools.ts               ← function calling definitions
│   │   └── tts/
│   │       ├── index.ts               ← TTSProvider interface + factory
│   │       ├── elevenlabs.ts          ← ElevenLabs (buffered + streaming)
│   │       └── qwen.ts                ← QwenTTS stub
│   ├── hooks/
│   │   ├── useNavtalkSession.ts       ← session state machine (init/live/ended/error)
│   │   └── useTranscript.ts           ← transcript accumulator + localStorage persistence
│   ├── types/
│   │   └── interview.ts               ← Specialty enum, InterviewMode, TranscriptTurn
│   ├── App.tsx                        ← screen router (pre/live/post)
│   └── main.tsx
├── public/
├── .env.example
├── vite.config.ts
└── package.json
```

---

## 5. Environment Variables

The block below is the content of the committed `.env.example` template (safe to commit — no real values). The actual `.env` file is gitignored and loaded by the **Electron main process**, then injected into the renderer via `contextBridge` preload. Keys are never embedded in the client-side bundle.

```env
# NavTalk
NAVTALK_API_KEY=
NAVTALK_CHARACTER=navtalk.Lauren

# AI Provider
AI_PROVIDER=anthropic          # "anthropic" | "openai-compatible"
AI_BASE_URL=                   # only for openai-compatible (e.g. http://localhost:1234/v1)
AI_API_KEY=
AI_MODEL=claude-opus-4-5       # or llama3, gpt-4o, etc.

# ElevenLabs TTS
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# QwenTTS (future — leave blank for MVP)
# QWEN_API_KEY=
# QWEN_VOICE_ID=
```

> For **web-only deployment** (non-Electron): add a server-side proxy layer (`/api/ai`, `/api/tts`, `/api/navtalk`) so keys never reach the client bundle. This is out of scope for MVP but required before any public hosting.

---

## 6. Types

```typescript
// src/types/interview.ts

export type Specialty =
  | 'internal-medicine'
  | 'general-surgery'
  | 'psychiatry'
  | 'pediatrics'
  | 'emergency-medicine'
  | 'family-medicine'

export type InterviewMode = 'behavioral' | 'clinical' | 'mixed'

export interface TranscriptTurn {
  speaker: 'interviewer' | 'student'
  text: string
  timestamp: number
}

export interface Question {
  id: string
  specialty: Specialty
  mode: Exclude<InterviewMode, 'mixed'>   // bank stores behavioral | clinical only
  text: string
  followUps?: string[]
}
```

---

## 7. Question Bank (MVP)

Local TypeScript data file — no external DB. Specialties in MVP:
- Internal Medicine (largest set — most common at JABSOM)
- General Surgery
- Psychiatry
- Pediatrics
- Emergency Medicine
- Family Medicine

Both behavioral (competency/MMI) and clinical (patient scenario) questions per specialty.

---

## 8. Design System (from Figma OMAI — `duYAgMMv10zXwDNVW9lGMv`)

- **Background:** Dark navy/slate
- **Accent:** Green (#22c55e range) for active states, progress indicators
- **Avatar:** Dominant, full or half-screen (`navtalk.Lauren`)
- **Typography:** Clean sans-serif, clinical/professional
- **Layout:** Single-column centered, avatar dominant, controls minimal and unobtrusive

---

## 9. Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| NavTalk provider | OpenAIRealtime | Enables camera recognition + function calling |
| Claude SDK | `@anthropic-ai/sdk` | Anthropic API is not OpenAI-compatible |
| OAI-compatible swap | `openai` SDK + baseURL | Drop-in for LM Studio, OpenAI, OpenRouter |
| Claude via OAI SDK | Route through OpenRouter | OpenRouter proxies Claude with OAI-compatible format |
| TTS primary | ElevenLabs (streaming) | NavTalk recommended, lowest latency via stream |
| TTS future | QwenTTS | Self-hosted option, stubbed now |
| Transcript timing | Post-session only | Reduces distraction during interview |
| Camera | WebRTC + snapshots (simultaneous) | WebRTC for NavTalk vision; snapshots for LLM function inputs |
| Key storage | Electron main process + preload | Never bundled into renderer JS |
| Transcript persistence | localStorage per turn | Survives accidental window close |
| Question bank | Local TypeScript | No DB dependency for MVP |

---

## 10. Out of Scope (MVP)

- User authentication / login
- Session recording or video playback
- AI-generated feedback / scoring
- Scheduling (Schedule Mock Interview screen)
- Residency panel / dashboard
- Self-assessment report screen
- QwenTTS implementation (stub only)
- Custom avatar creation
- Server-side API proxy (needed for web deployment, not Electron)
- Session persistence beyond localStorage (cloud sync, history)
