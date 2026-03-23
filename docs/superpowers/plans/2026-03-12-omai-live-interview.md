# OMAI Live Interview Session Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React/Electron app for AI-powered residency mock interviews using NavTalk avatar, ElevenLabs TTS, and a configurable LLM backend.

**Architecture:** Three-screen flow (pre-session → live session → post-session). NavTalk handles the avatar, WebRTC, and LLM calls via its cloud backend. ElevenLabs provides TTS audio injected into the WebRTC stream for lip-sync. All API keys live in the Electron main process and are injected into the renderer via contextBridge.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, Electron, NavTalk WebRTC/WebSocket API, ElevenLabs TTS API, Vitest + Testing Library

---

## Chunk 1: Project Scaffolding

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `omai-interview/package.json`
- Create: `omai-interview/vite.config.ts`
- Create: `omai-interview/tsconfig.json`
- Create: `omai-interview/tsconfig.node.json`
- Create: `omai-interview/index.html`
- Create: `omai-interview/src/main.tsx`
- Create: `omai-interview/src/App.tsx`
- Create: `omai-interview/src/vite-env.d.ts`

- [ ] **Step 1: Scaffold project**

Run from `/Users/Jesse/OME-Claude/`:
```bash
npm create vite@latest omai-interview -- --template react-ts
cd omai-interview
npm install
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install tailwindcss @tailwindcss/vite
npm install @anthropic-ai/sdk openai
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind in vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create test setup file**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create global CSS with Tailwind**

```css
/* src/index.css */
@import "tailwindcss";
```

- [ ] **Step 6: Create tailwind.config.ts with OMAI theme**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d38',
          600: '#1e2a4a',
        },
        accent: {
          500: '#22c55e',
          400: '#4ade80',
          600: '#16a34a',
        },
      },
    },
  },
} satisfies Config
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite server starts on `http://localhost:5173`

- [ ] **Step 8: Commit**

```bash
git add omai-interview/
git commit -m "feat: scaffold Vite + React + TypeScript project for OMAI interview app"
```

---

### Task 2: Electron main process + preload

**Files:**
- Create: `omai-interview/electron/main.ts`
- Create: `omai-interview/electron/preload.ts`
- Create: `omai-interview/electron/electron-env.d.ts`
- Modify: `omai-interview/package.json` — add electron deps + scripts
- Create: `omai-interview/.env.example`
- Create: `omai-interview/.gitignore`

- [ ] **Step 1: Install Electron dependencies**

```bash
cd omai-interview
npm install --save-dev electron electron-builder vite-plugin-electron vite-plugin-electron-renderer
npm install dotenv
```

- [ ] **Step 2: Update vite.config.ts for Electron**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.ts',
        onstart({ reload }) {
          reload()
        },
      },
    ]),
    renderer(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: Write Electron main process**

```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
```

- [ ] **Step 4: Write preload script (contextBridge)**

```typescript
// electron/preload.ts
import { contextBridge } from 'electron'

// Expose env config to renderer — never use VITE_ prefix (would bundle into JS)
// All values are read from process.env in the main process via dotenv
contextBridge.exposeInMainWorld('electronEnv', {
  navtalk: {
    apiKey: process.env.NAVTALK_API_KEY ?? '',
    character: process.env.NAVTALK_CHARACTER ?? 'navtalk.Lauren',
  },
  ai: {
    provider: process.env.AI_PROVIDER ?? 'openai-compatible',
    baseUrl: process.env.AI_BASE_URL ?? 'https://openrouter.ai/api/v1',
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'anthropic/claude-opus-4-5',
  },
  tts: {
    provider: process.env.TTS_PROVIDER ?? 'elevenlabs',
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY ?? '',
      voiceId: process.env.ELEVENLABS_VOICE_ID ?? '',
    },
  },
})
```

- [ ] **Step 5: Write Electron type declarations**

```typescript
// electron/electron-env.d.ts
interface ElectronEnv {
  navtalk: { apiKey: string; character: string }
  ai: { provider: string; baseUrl: string; apiKey: string; model: string }
  tts: {
    provider: string
    elevenlabs: { apiKey: string; voiceId: string }
  }
}

declare global {
  interface Window {
    electronEnv: ElectronEnv
  }
}

export {}
```

- [ ] **Step 6: Create .env.example**

```bash
cat > .env.example << 'EOF'
# NavTalk
NAVTALK_API_KEY=
NAVTALK_CHARACTER=navtalk.Lauren

# AI Provider (NavTalk uses this to make LLM calls from its backend)
# AI_PROVIDER: "anthropic" uses @anthropic-ai/sdk directly (future non-NavTalk use)
#              "openai-compatible" uses openai SDK with baseURL
# For Claude via NavTalk: use "openai-compatible" + OpenRouter baseURL
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=
AI_MODEL=anthropic/claude-opus-4-5

# ElevenLabs TTS
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# QwenTTS (future - self-hosted, not implemented in MVP)
# QWEN_API_KEY=
# QWEN_VOICE_ID=

# NOTE: For LM Studio (local): AI_BASE_URL=http://localhost:1234/v1
# NavTalk is cloud-based and cannot reach localhost.
# Use a public tunnel (e.g. ngrok http 1234) and set the tunnel URL as AI_BASE_URL.
EOF
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
dist-electron/
.env
*.local
```

- [ ] **Step 8: Update package.json scripts**

Add to `package.json`:
```json
{
  "main": "dist-electron/main.mjs",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "electron:dev": "vite",
    "electron:build": "tsc -b && vite build && electron-builder",
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: add Electron main process, preload contextBridge, and .env.example"
```

---

### Task 3: Shared types

**Files:**
- Create: `omai-interview/src/types/interview.ts`
- Create: `omai-interview/src/types/interview.test.ts`

- [ ] **Step 1: Write type tests first**

```typescript
// src/types/interview.test.ts
import { describe, it, expect } from 'vitest'
import type { Specialty, InterviewMode, TranscriptTurn, Question } from './interview'

describe('Specialty type', () => {
  it('accepts all valid specialty strings', () => {
    const specialties: Specialty[] = [
      'internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine',
    ]
    expect(specialties).toHaveLength(6)
  })
})

describe('TranscriptTurn', () => {
  it('has required shape', () => {
    const turn: TranscriptTurn = {
      speaker: 'interviewer',
      text: 'Tell me about yourself.',
      timestamp: Date.now(),
    }
    expect(turn.speaker).toBe('interviewer')
    expect(turn.text).toBeTruthy()
    expect(typeof turn.timestamp).toBe('number')
  })
})

describe('Question', () => {
  it('has required shape', () => {
    const q: Question = {
      id: 'im-b-001',
      specialty: 'internal-medicine',
      mode: 'behavioral',
      text: 'Tell me about a time you managed a difficult patient.',
    }
    expect(q.id).toBe('im-b-001')
    expect(q.followUps).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — expect TypeScript errors (types don't exist yet)**

```bash
npm run test:run -- src/types/interview.test.ts
```
Expected: FAIL — cannot find module

- [ ] **Step 3: Write types**

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

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  'internal-medicine': 'Internal Medicine',
  'general-surgery': 'General Surgery',
  'psychiatry': 'Psychiatry',
  'pediatrics': 'Pediatrics',
  'emergency-medicine': 'Emergency Medicine',
  'family-medicine': 'Family Medicine',
}

export const MODE_LABELS: Record<InterviewMode, string> = {
  behavioral: 'Behavioral / MMI',
  clinical: 'Clinical Scenarios',
  mixed: 'Mixed',
}

export interface TranscriptTurn {
  speaker: 'interviewer' | 'student'
  text: string
  timestamp: number
}

export interface Question {
  id: string
  specialty: Specialty
  mode: Exclude<InterviewMode, 'mixed'>
  text: string
  followUps?: string[]
}

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'reconnecting'
  | 'error'
  | 'ended'

export interface SessionConfig {
  specialty: Specialty
  mode: InterviewMode
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/types/interview.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add shared interview types (Specialty, TranscriptTurn, Question, SessionStatus)"
```

---

## Chunk 2: Data Layer — Question Bank + AI Prompts + Tools

### Task 4: Question bank

**Files:**
- Create: `omai-interview/src/lib/ai/questionBank.ts`
- Create: `omai-interview/src/lib/ai/questionBank.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/ai/questionBank.test.ts
import { describe, it, expect } from 'vitest'
import { getQuestions, getQuestion, QUESTION_BANK } from './questionBank'

describe('QUESTION_BANK', () => {
  it('has questions for all 6 specialties', () => {
    const specialties = ['internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine']
    for (const s of specialties) {
      const qs = QUESTION_BANK.filter(q => q.specialty === s)
      expect(qs.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('has both behavioral and clinical questions for each specialty', () => {
    const specialties = ['internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine']
    for (const s of specialties) {
      const behavioral = QUESTION_BANK.filter(q => q.specialty === s && q.mode === 'behavioral')
      const clinical = QUESTION_BANK.filter(q => q.specialty === s && q.mode === 'clinical')
      expect(behavioral.length).toBeGreaterThanOrEqual(3)
      expect(clinical.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('has unique IDs', () => {
    const ids = QUESTION_BANK.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getQuestions', () => {
  it('filters by specialty and mode', () => {
    const results = getQuestions('internal-medicine', 'behavioral')
    expect(results.every(q => q.specialty === 'internal-medicine')).toBe(true)
    expect(results.every(q => q.mode === 'behavioral')).toBe(true)
  })

  it('returns questions for mixed mode (both behavioral and clinical)', () => {
    const results = getQuestions('internal-medicine', 'mixed')
    const hasBehavioral = results.some(q => q.mode === 'behavioral')
    const hasClinical = results.some(q => q.mode === 'clinical')
    expect(hasBehavioral).toBe(true)
    expect(hasClinical).toBe(true)
  })
})

describe('getQuestion', () => {
  it('returns question at index', () => {
    const q = getQuestion('internal-medicine', 'behavioral', 0)
    expect(q).toBeDefined()
    expect(q!.specialty).toBe('internal-medicine')
  })

  it('returns undefined for out-of-bounds index', () => {
    const q = getQuestion('internal-medicine', 'behavioral', 9999)
    expect(q).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/ai/questionBank.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write question bank**

```typescript
// src/lib/ai/questionBank.ts
import type { Question, Specialty, InterviewMode } from '../../types/interview'

export const QUESTION_BANK: Question[] = [
  // ── Internal Medicine ──────────────────────────────────────────────────
  // Behavioral
  { id: 'im-b-001', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Tell me about a time you managed a diagnostic dilemma. How did you approach the uncertainty?',
    followUps: ['What would you do differently?', 'How did the patient respond?'] },
  { id: 'im-b-002', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Describe a situation where you had to deliver difficult news to a patient or family.',
    followUps: ['How did you prepare?', 'What was the outcome?'] },
  { id: 'im-b-003', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Tell me about a time you disagreed with a senior colleague about a patient\'s management plan.' },
  { id: 'im-b-004', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Describe a time you made a medical error or near-miss. What did you learn from it?' },
  { id: 'im-b-005', specialty: 'internal-medicine', mode: 'behavioral',
    text: 'Why are you choosing Internal Medicine? What draws you to long-term patient relationships?' },

  // Clinical
  { id: 'im-c-001', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 68-year-old with hypertension and DM2 presents with 3 days of progressively worsening dyspnea and bilateral leg edema. Walk me through your evaluation.',
    followUps: ['What initial labs and imaging would you order?', 'What if the BNP is markedly elevated?'] },
  { id: 'im-c-002', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 45-year-old presents with fatigue, weight loss of 15 lbs over 3 months, and night sweats. How do you approach this workup?' },
  { id: 'im-c-003', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A patient on warfarin for AFib comes in with an INR of 8.5 and mild nosebleed. What is your management?' },
  { id: 'im-c-004', specialty: 'internal-medicine', mode: 'clinical',
    text: 'A 55-year-old with a history of GERD presents with new-onset dysphagia to solids. How do you evaluate this?' },
  { id: 'im-c-005', specialty: 'internal-medicine', mode: 'clinical',
    text: 'Describe your approach to a patient with newly diagnosed type 2 diabetes, HbA1c 9.2%, presenting for initial management.' },

  // ── General Surgery ────────────────────────────────────────────────────
  // Behavioral
  { id: 'gs-b-001', specialty: 'general-surgery', mode: 'behavioral',
    text: 'Surgery can be physically and emotionally demanding. Tell me about a time you performed under significant stress.' },
  { id: 'gs-b-002', specialty: 'general-surgery', mode: 'behavioral',
    text: 'Describe a time you had to tell a patient that surgery was not the right option for them.' },
  { id: 'gs-b-003', specialty: 'general-surgery', mode: 'behavioral',
    text: 'How do you handle a situation when a procedure is not going as planned and you need to call for help?' },

  // Clinical
  { id: 'gs-c-001', specialty: 'general-surgery', mode: 'clinical',
    text: 'A 32-year-old presents with 12 hours of periumbilical pain that has migrated to the RLQ, with fever and rebound tenderness. What is your management?',
    followUps: ['What if imaging shows a perforated appendix?'] },
  { id: 'gs-c-002', specialty: 'general-surgery', mode: 'clinical',
    text: 'An 80-year-old with a history of COPD presents with acute small bowel obstruction. How do you assess surgical risk and make an operative decision?' },
  { id: 'gs-c-003', specialty: 'general-surgery', mode: 'clinical',
    text: 'A patient returns 48 hours post-laparoscopic cholecystectomy with fever, RUQ pain, and elevated bilirubin. Walk me through your evaluation.' },

  // ── Psychiatry ─────────────────────────────────────────────────────────
  // Behavioral
  { id: 'psy-b-001', specialty: 'psychiatry', mode: 'behavioral',
    text: 'Psychiatry often involves patients in crisis. Tell me about a time you de-escalated a volatile situation with a patient.' },
  { id: 'psy-b-002', specialty: 'psychiatry', mode: 'behavioral',
    text: 'How do you maintain boundaries and self-care when working with patients experiencing severe trauma?' },
  { id: 'psy-b-003', specialty: 'psychiatry', mode: 'behavioral',
    text: 'Why psychiatry? What specific experiences led you to this field?' },

  // Clinical
  { id: 'psy-c-001', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 28-year-old is brought in by police after threatening to harm himself. He is agitated and refuses to talk. How do you approach this evaluation?',
    followUps: ['Under what criteria would you initiate an involuntary hold?'] },
  { id: 'psy-c-002', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 19-year-old college student presents with two weeks of decreased sleep, elevated mood, grandiosity, and impulsive spending. What is your differential and initial approach?' },
  { id: 'psy-c-003', specialty: 'psychiatry', mode: 'clinical',
    text: 'A 45-year-old on lithium for bipolar disorder presents with tremor, confusion, and GI upset. What do you suspect and how do you manage it?' },

  // ── Pediatrics ─────────────────────────────────────────────────────────
  // Behavioral
  { id: 'ped-b-001', specialty: 'pediatrics', mode: 'behavioral',
    text: 'Pediatrics requires communicating with both children and their parents. Tell me about a time these conversations were in tension.' },
  { id: 'ped-b-002', specialty: 'pediatrics', mode: 'behavioral',
    text: 'How do you approach a family that refuses a recommended vaccine or treatment for their child?' },
  { id: 'ped-b-003', specialty: 'pediatrics', mode: 'behavioral',
    text: 'Describe an experience that shaped your commitment to working with children.' },

  // Clinical
  { id: 'ped-c-001', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 2-month-old presents with fever of 38.5°C. The parents are anxious. Walk me through your evaluation.',
    followUps: ['At what temperature threshold does your management change?', 'What is your sepsis workup?'] },
  { id: 'ped-c-002', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 4-year-old presents with stridor, drooling, and a tripod position. What is your immediate approach?' },
  { id: 'ped-c-003', specialty: 'pediatrics', mode: 'clinical',
    text: 'A 10-year-old with known asthma presents with an acute exacerbation not responding to initial albuterol. What is your step-up treatment plan?' },

  // ── Emergency Medicine ─────────────────────────────────────────────────
  // Behavioral
  { id: 'em-b-001', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'Emergency medicine means managing uncertainty with incomplete information. Give me an example of a time you had to act quickly without all the data.' },
  { id: 'em-b-002', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'How do you manage moral distress when a trauma patient arrives and survival seems unlikely?' },
  { id: 'em-b-003', specialty: 'emergency-medicine', mode: 'behavioral',
    text: 'Describe a time you had to lead a resuscitation team. What did you learn about team dynamics?' },

  // Clinical
  { id: 'em-c-001', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A 55-year-old male presents with crushing substernal chest pain radiating to the left arm. His ECG shows ST elevation in leads II, III, aVF. What is your immediate management?',
    followUps: ['The cath lab is 45 minutes away. What is your decision regarding thrombolytics?'] },
  { id: 'em-c-002', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A 30-year-old pedestrian struck by a car arrives with GCS of 12, tachycardia, and hypotension. Walk me through your primary survey.' },
  { id: 'em-c-003', specialty: 'emergency-medicine', mode: 'clinical',
    text: 'A patient presents with anaphylaxis after a bee sting. What is your immediate treatment and monitoring plan?' },

  // ── Family Medicine ────────────────────────────────────────────────────
  // Behavioral
  { id: 'fm-b-001', specialty: 'family-medicine', mode: 'behavioral',
    text: 'Family medicine requires breadth across the lifespan. Tell me about an experience that highlighted the value of longitudinal patient relationships.' },
  { id: 'fm-b-002', specialty: 'family-medicine', mode: 'behavioral',
    text: 'How do you address health disparities you encounter in your patient population?' },
  { id: 'fm-b-003', specialty: 'family-medicine', mode: 'behavioral',
    text: 'Describe a time you coordinated care across multiple specialists for a complex patient. What challenges did you face?' },

  // Clinical
  { id: 'fm-c-001', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 50-year-old presents for an annual physical. He has hypertension, obesity (BMI 34), and a family history of CAD. What is your preventive care agenda for this visit?' },
  { id: 'fm-c-002', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 16-year-old comes in alone for a well visit. You notice signs of depression and she asks about confidentiality. How do you navigate this?' },
  { id: 'fm-c-003', specialty: 'family-medicine', mode: 'clinical',
    text: 'A 72-year-old with COPD, CHF, and DM2 on 12 medications is struggling with polypharmacy side effects. How do you approach medication reconciliation?' },
]

export function getQuestions(
  specialty: Specialty,
  mode: InterviewMode
): Question[] {
  if (mode === 'mixed') {
    return QUESTION_BANK.filter(q => q.specialty === specialty)
  }
  return QUESTION_BANK.filter(q => q.specialty === specialty && q.mode === mode)
}

export function getQuestion(
  specialty: Specialty,
  mode: InterviewMode,
  index: number
): Question | undefined {
  return getQuestions(specialty, mode)[index]
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/ai/questionBank.test.ts
```
Expected: PASS (all assertions)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/questionBank.ts src/lib/ai/questionBank.test.ts
git commit -m "feat: add residency interview question bank (6 specialties, behavioral + clinical)"
```

---

### Task 5: System prompt builder

**Files:**
- Create: `omai-interview/src/lib/ai/prompts.ts`
- Create: `omai-interview/src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/ai/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from './prompts'

describe('buildSystemPrompt', () => {
  it('includes specialty name in prompt', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt).toContain('Internal Medicine')
  })

  it('includes behavioral mode instructions', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt.toLowerCase()).toContain('behavioral')
  })

  it('includes clinical mode instructions', () => {
    const prompt = buildSystemPrompt('psychiatry', 'clinical')
    expect(prompt.toLowerCase()).toContain('clinical')
  })

  it('includes mixed mode instructions', () => {
    const prompt = buildSystemPrompt('pediatrics', 'mixed')
    expect(prompt.toLowerCase()).toContain('mixed')
  })

  it('mentions the get_question function tool', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt).toContain('get_question')
  })

  it('returns a non-empty string', () => {
    const prompt = buildSystemPrompt('emergency-medicine', 'clinical')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(200)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/ai/prompts.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement prompt builder**

```typescript
// src/lib/ai/prompts.ts
import type { Specialty, InterviewMode } from '../../types/interview'
import { SPECIALTY_LABELS, MODE_LABELS } from '../../types/interview'

export function buildSystemPrompt(
  specialty: Specialty,
  mode: InterviewMode
): string {
  const specialtyName = SPECIALTY_LABELS[specialty]
  const modeName = MODE_LABELS[mode]

  const modeInstructions = {
    behavioral: `You ask competency-based and MMI-style behavioral questions. Focus on past experience, communication, professionalism, and ethical reasoning. Ask "tell me about a time..." style questions. Use the STAR framework implicitly to probe responses.`,
    clinical: `You present clinical scenarios relevant to ${specialtyName}. Present a patient case, then ask the candidate to walk through their evaluation and management. Ask follow-up questions to probe depth of clinical reasoning.`,
    mixed: `You alternate between behavioral/MMI questions and clinical case scenarios for ${specialtyName}. Mix question types naturally throughout the interview as a real interviewer would. When calling \`get_question\`, always pass either "behavioral" or "clinical" as the mode — never "mixed". Alternate between the two types across questions.`,
  }

  return `You are Dr. Lauren, a senior ${specialtyName} attending physician conducting a residency program interview at a major academic medical center.

## Your Role
You are evaluating a medical student or resident applicant for the ${specialtyName} residency program. This interview is ${modeName.toLowerCase()} in style.

## Interview Style
- Professional, warm, and encouraging — this is stressful for applicants
- Ask one question at a time and wait for a complete response
- Probe with thoughtful follow-up questions when answers are superficial
- Acknowledge good answers briefly before moving on ("That's a thoughtful approach...")
- Do not provide medical advice or correct clinical errors mid-interview — save feedback framing for end

## Question Mode: ${modeName}
${modeInstructions[mode]}

## Getting Questions
Use the \`get_question\` function to retrieve interview questions. Pass the specialty ("${specialty}"), the mode (use "behavioral" or "clinical", not "mixed"), and the current question index (starting at 0, incrementing after each question).

## Interview Structure
1. Introduce yourself briefly and put the candidate at ease
2. Ask 4–6 questions, using get_question to fetch them
3. Allow natural follow-up conversation
4. Close the interview professionally: "That's all the questions I have for you today. Do you have any questions for me about the program?"

## Tone
Speak naturally as a human interviewer would in a real residency interview. Do not sound robotic or list-like. Be conversational.`
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/ai/prompts.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat: add system prompt builder for residency interview AI persona"
```

---

### Task 6: Function calling tools definition

**Files:**
- Create: `omai-interview/src/lib/ai/tools.ts`
- Create: `omai-interview/src/lib/ai/tools.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/ai/tools.test.ts
import { describe, it, expect } from 'vitest'
import { INTERVIEW_TOOLS, handleToolCall } from './tools'

describe('INTERVIEW_TOOLS', () => {
  it('exports an array with get_question tool', () => {
    expect(Array.isArray(INTERVIEW_TOOLS)).toBe(true)
    const tool = INTERVIEW_TOOLS.find(t => t.name === 'get_question')
    expect(tool).toBeDefined()
  })

  it('get_question has valid JSON Schema parameters', () => {
    const tool = INTERVIEW_TOOLS.find(t => t.name === 'get_question')!
    const params = tool.parameters
    expect(params.type).toBe('object')
    expect(params.properties.specialty.type).toBe('string')
    expect(Array.isArray(params.properties.specialty.enum)).toBe(true)
    expect(params.properties.mode.type).toBe('string')
    expect(Array.isArray(params.properties.mode.enum)).toBe(true)
    expect(params.properties.mode.enum).not.toContain('mixed')
    expect(params.properties.questionIndex.type).toBe('number')
    expect(params.required).toContain('specialty')
    expect(params.required).toContain('mode')
    expect(params.required).toContain('questionIndex')
  })
})

describe('handleToolCall', () => {
  it('returns a question for get_question', () => {
    const result = handleToolCall('get_question', {
      specialty: 'internal-medicine',
      mode: 'behavioral',
      questionIndex: 0,
    })
    expect(result).toBeDefined()
    expect(result.text).toBeTruthy()
  })

  it('returns null for unknown tool', () => {
    const result = handleToolCall('unknown_tool', {})
    expect(result).toBeNull()
  })

  it('returns null for out-of-bounds question index', () => {
    const result = handleToolCall('get_question', {
      specialty: 'internal-medicine',
      mode: 'behavioral',
      questionIndex: 9999,
    })
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/ai/tools.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement tools**

```typescript
// src/lib/ai/tools.ts
import type { Specialty, InterviewMode } from '../../types/interview'
import { getQuestion } from './questionBank'

// JSON Schema format required by OpenAI function calling API
export const INTERVIEW_TOOLS = [
  {
    type: 'function' as const,
    name: 'get_question',
    description: 'Retrieve the next interview question for the current residency specialty and interview mode. Call this whenever you need a new question to ask the candidate.',
    parameters: {
      type: 'object' as const,
      properties: {
        specialty: {
          type: 'string',
          enum: [
            'internal-medicine',
            'general-surgery',
            'psychiatry',
            'pediatrics',
            'emergency-medicine',
            'family-medicine',
          ],
          description: 'The residency specialty for this interview',
        },
        mode: {
          type: 'string',
          enum: ['behavioral', 'clinical'],
          description: 'The interview mode — behavioral for MMI/competency questions, clinical for patient scenarios',
        },
        questionIndex: {
          type: 'number',
          description: 'Zero-based index of the question to retrieve. Increment by 1 after each question asked.',
        },
      },
      required: ['specialty', 'mode', 'questionIndex'],
    },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleToolCall(name: string, args: Record<string, any>): any {
  if (name === 'get_question') {
    const { specialty, mode, questionIndex } = args as {
      specialty: Specialty
      mode: Exclude<InterviewMode, 'mixed'>
      questionIndex: number
    }
    const question = getQuestion(specialty, mode, questionIndex)
    return question ?? null
  }
  return null
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/ai/tools.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/tools.ts src/lib/ai/tools.test.ts
git commit -m "feat: add function calling tool definitions for NavTalk interview question retrieval"
```

---

## Chunk 3: TTS Layer + NavTalk Library

### Task 7: TTS provider interface + ElevenLabs implementation

**Files:**
- Create: `omai-interview/src/lib/tts/index.ts`
- Create: `omai-interview/src/lib/tts/elevenlabs.ts`
- Create: `omai-interview/src/lib/tts/qwen.ts`
- Create: `omai-interview/src/lib/tts/tts.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/tts/tts.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createTTSProvider } from './index'
import { QwenTTS } from './qwen'

describe('createTTSProvider', () => {
  it('creates ElevenLabsTTS for elevenlabs provider', () => {
    const provider = createTTSProvider('elevenlabs', { apiKey: 'test', voiceId: 'test' })
    expect(provider).toBeDefined()
    expect(typeof provider.synthesize).toBe('function')
    expect(typeof provider.synthesizeStream).toBe('function')
  })

  it('throws for unknown provider', () => {
    expect(() => createTTSProvider('unknown' as any, {})).toThrow()
  })
})

describe('QwenTTS stub', () => {
  const qwen = new QwenTTS()

  it('synthesize throws NotImplementedError', async () => {
    await expect(qwen.synthesize('test')).rejects.toThrow('QwenTTS is not yet implemented')
  })

  it('synthesizeStream throws NotImplementedError', async () => {
    const gen = qwen.synthesizeStream('test')
    await expect(gen.next()).rejects.toThrow('QwenTTS is not yet implemented')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/tts/tts.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write TTSProvider interface**

```typescript
// src/lib/tts/index.ts
import { ElevenLabsTTS } from './elevenlabs'
import { QwenTTS } from './qwen'

export interface TTSProvider {
  synthesize(text: string): Promise<ArrayBuffer>
  synthesizeStream(text: string): AsyncIterable<Uint8Array>
}

export type TTSProviderName = 'elevenlabs' | 'qwen'

interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
}

export function createTTSProvider(
  name: TTSProviderName,
  config: ElevenLabsConfig | Record<string, string>
): TTSProvider {
  if (name === 'elevenlabs') {
    return new ElevenLabsTTS(config as ElevenLabsConfig)
  }
  if (name === 'qwen') {
    return new QwenTTS()
  }
  throw new Error(`Unknown TTS provider: ${name}`)
}
```

- [ ] **Step 4: Write ElevenLabs TTS**

```typescript
// src/lib/tts/elevenlabs.ts
import type { TTSProvider } from './index'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export class ElevenLabsTTS implements TTSProvider {
  private apiKey: string
  private voiceId: string

  constructor({ apiKey, voiceId }: { apiKey: string; voiceId: string }) {
    this.apiKey = apiKey
    this.voiceId = voiceId
  }

  async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.status} ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  async *synthesizeStream(text: string): AsyncGenerator<Uint8Array> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${this.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          output_format: 'pcm_16000',
        }),
      }
    )

    if (!response.ok || !response.body) {
      throw new Error(`ElevenLabs TTS stream error: ${response.status}`)
    }

    const reader = response.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}
```

- [ ] **Step 5: Write QwenTTS stub**

```typescript
// src/lib/tts/qwen.ts
import type { TTSProvider } from './index'

export class QwenTTS implements TTSProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async synthesize(_text: string): Promise<ArrayBuffer> {
    throw new Error(
      'QwenTTS is not yet implemented. ' +
      'This is a stub for future self-hosted TTS support. ' +
      'Set TTS_PROVIDER=elevenlabs in your .env to use ElevenLabs.'
    )
  }

  async *synthesizeStream(_text: string): AsyncGenerator<Uint8Array> {
    throw new Error(
      'QwenTTS is not yet implemented. ' +
      'This is a stub for future self-hosted TTS support. ' +
      'Set TTS_PROVIDER=elevenlabs in your .env to use ElevenLabs.'
    )
    // Required for TypeScript generator typing:
    yield new Uint8Array()
  }
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/tts/tts.test.ts
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/tts/
git commit -m "feat: add TTS provider interface, ElevenLabs implementation, and QwenTTS stub"
```

---

### Task 7.5: Web Audio scheduler (TTS → WebRTC lip-sync)

**Files:**
- Create: `omai-interview/src/lib/tts/audioScheduler.ts`
- Create: `omai-interview/src/lib/tts/audioScheduler.test.ts`

> This module bridges ElevenLabs PCM16 chunks to NavTalk's WebRTC audio track.
> Without it, TTS audio plays locally but NavTalk never receives it and lip-sync doesn't work.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/tts/audioScheduler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioScheduler } from './audioScheduler'

// Mock Web Audio API
const mockDestinationStream = { id: 'mock-stream' } as unknown as MediaStream
const mockDestination = { stream: mockDestinationStream }
const mockBufferSource = {
  buffer: null as AudioBuffer | null,
  connect: vi.fn(),
  start: vi.fn(),
}
const mockAudioContext = {
  sampleRate: 16000,
  currentTime: 0,
  createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
  createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(160)) }),
  createMediaStreamDestination: vi.fn().mockReturnValue(mockDestination),
  decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.01, getChannelData: vi.fn() }),
}
vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext))

describe('AudioScheduler', () => {
  let scheduler: AudioScheduler

  beforeEach(() => {
    vi.clearAllMocks()
    scheduler = new AudioScheduler()
  })

  it('exposes a MediaStream for WebRTC injection', () => {
    expect(scheduler.stream).toBeDefined()
    expect(scheduler.stream).toBe(mockDestinationStream)
  })

  it('scheduleChunk schedules audio via AudioBufferSourceNode', async () => {
    const chunk = new Uint8Array(320) // 160 samples × 2 bytes (PCM16)
    await scheduler.scheduleChunk(chunk)
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
    expect(mockBufferSource.connect).toHaveBeenCalledWith(mockDestination)
    expect(mockBufferSource.start).toHaveBeenCalled()
  })

  it('advances playhead after each chunk', async () => {
    const chunk = new Uint8Array(320)
    await scheduler.scheduleChunk(chunk)
    await scheduler.scheduleChunk(chunk)
    // start() should be called with increasing offsets
    const calls = mockBufferSource.start.mock.calls
    expect(calls.length).toBe(2)
  })

  it('reset() resets the playhead', () => {
    scheduler.reset()
    expect(scheduler['playhead']).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/tts/audioScheduler.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement AudioScheduler**

```typescript
// src/lib/tts/audioScheduler.ts
// Bridges ElevenLabs PCM16 audio chunks to a WebRTC MediaStream for NavTalk lip-sync.
// Uses Web Audio API: PCM16 chunks → AudioBufferSourceNode → MediaStreamDestination → RTCPeerConnection.

const SAMPLE_RATE = 16000 // must match ElevenLabs output_format: 'pcm_16000'

export class AudioScheduler {
  private ctx: AudioContext
  private destination: MediaStreamAudioDestinationNode
  private playhead = 0

  readonly stream: MediaStream

  constructor() {
    // Create AudioContext at the ElevenLabs output sample rate to avoid pitch-shifting
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.destination = this.ctx.createMediaStreamDestination()
    this.stream = this.destination.stream
  }

  async scheduleChunk(chunk: Uint8Array): Promise<void> {
    // PCM16 = 2 bytes per sample, signed 16-bit little-endian
    const samples = chunk.length / 2
    const buffer = this.ctx.createBuffer(1, samples, SAMPLE_RATE)
    const channelData = buffer.getChannelData(0)

    const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    for (let i = 0; i < samples; i++) {
      // Convert Int16 → Float32 [-1, 1]
      channelData[i] = dataView.getInt16(i * 2, true) / 32768
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.destination)

    // Schedule at current playhead, or immediately if we're behind real time
    const startTime = Math.max(this.ctx.currentTime, this.playhead)
    source.start(startTime)
    this.playhead = startTime + buffer.duration
  }

  reset(): void {
    this.playhead = 0
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/tts/audioScheduler.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/tts/audioScheduler.ts src/lib/tts/audioScheduler.test.ts
git commit -m "feat: add AudioScheduler — bridges ElevenLabs PCM16 chunks to WebRTC MediaStream for NavTalk lip-sync"
```

---

### Task 8: NavTalk event types + session manager

**Files:**
- Create: `omai-interview/src/lib/navtalk/events.ts`
- Create: `omai-interview/src/lib/navtalk/session.ts`
- Create: `omai-interview/src/lib/navtalk/session.test.ts`

> **Important:** NavTalk WebSocket event names must be verified against NavTalk's API docs
> before first live test. The names below match NavTalk's published documentation but
> should be confirmed in the NavTalk dashboard before going to production.

- [ ] **Step 1: Write typed NavTalk events**

```typescript
// src/lib/navtalk/events.ts
// NavTalk WebSocket message types (v2 unified connection)
// SOURCE: NavTalk API docs — verify names against NavTalk dashboard before implementation

export type NavTalkInboundEvent =
  | ConnectedSuccessEvent
  | ConnectedWarningEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SpeechStartedEvent
  | TranscriptUserEvent
  | TranscriptAssistantEvent
  | FunctionCallEvent
  | ErrorEvent
  | WebRTCOfferEvent
  | WebRTCIceCandidateEvent

export interface ConnectedSuccessEvent {
  type: 'conversation.connected.success'
  data: {
    sessionId: string
    iceServers: RTCIceServer[]
  }
}

export interface ConnectedWarningEvent {
  type: 'conversation.connected.warning'
  data: { message: string }
}

export interface SessionCreatedEvent {
  type: 'REALTIME_SESSION_CREATED'
  data: Record<string, unknown>
}

export interface SessionUpdatedEvent {
  type: 'REALTIME_SESSION_UPDATED'
  data: Record<string, unknown>
}

export interface SpeechStartedEvent {
  type: 'realtime.input_audio_buffer.speech_started'
  data: Record<string, unknown>
}

// Transcript events — exact names TBD from NavTalk API reference
// These are the most likely names based on OpenAI Realtime API conventions
export interface TranscriptUserEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  data: { transcript: string }
}

export interface TranscriptAssistantEvent {
  type: 'response.audio_transcript.done'
  data: { transcript: string }
}

export interface FunctionCallEvent {
  type: 'realtime.response.function_call_arguments.done'
  data: {
    function_name: string
    arguments: string
    call_id: string
  }
}

export interface ErrorEvent {
  type: 'error'
  data: { message: string; code?: string }
}

export interface WebRTCOfferEvent {
  type: 'webrtc.offer'
  data: { sdp: string }
}

export interface WebRTCIceCandidateEvent {
  type: 'webrtc.ice_candidate'
  data: { candidate: RTCIceCandidateInit }
}

// Outbound message types (app → NavTalk)
export interface InputConfigMessage {
  type: 'realtime.input_config'
  data: {
    instructions: string
    tools: unknown[]
    model?: string
    voice?: string
  }
}

export interface AudioBufferAppendMessage {
  type: 'input_audio_buffer.append'
  data: { audio: string } // base64-encoded PCM16
}

export interface InputImageMessage {
  type: 'realtime.input_image'
  data: { image: string } // base64-encoded JPEG
}

export interface FunctionCallOutputMessage {
  type: 'conversation.item.create'
  data: {
    item: {
      type: 'function_call_output'
      call_id: string
      output: string
    }
  }
}

export interface ResponseCreateMessage {
  type: 'response.create'
  data: Record<string, unknown>
}

export interface WebRTCAnswerMessage {
  type: 'webrtc.answer'
  data: { sdp: string | undefined }
}
```

- [ ] **Step 2: Write session manager tests (behavior-focused, mocking WebSocket)**

```typescript
// src/lib/navtalk/session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NavTalkSession } from './session'

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  sentMessages: string[] = []

  send(data: string) { this.sentMessages.push(data) }
  close() { this.readyState = 3 }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
  }
}

vi.stubGlobal('WebSocket', MockWebSocket)
vi.stubGlobal('RTCPeerConnection', vi.fn(() => ({
  addTrack: vi.fn(),
  setRemoteDescription: vi.fn(),
  createAnswer: vi.fn().mockResolvedValue({ sdp: 'answer-sdp', type: 'answer' }),
  setLocalDescription: vi.fn(),
  ontrack: null,
  onicecandidate: null,
  close: vi.fn(),
})))

describe('NavTalkSession', () => {
  let session: NavTalkSession

  beforeEach(() => {
    session = new NavTalkSession({
      apiKey: 'test-key',
      character: 'navtalk.Lauren',
      instructions: 'You are a medical interviewer.',
      tools: [],
    })
  })

  it('constructs without connecting', () => {
    expect(session.status).toBe('idle')
  })

  it('transitions to connecting on connect()', () => {
    session.connect()
    expect(session.status).toBe('connecting')
  })

  it('does NOT send input_config on socket open — waits for connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.onopen?.()
    const configMsg = ws.sentMessages.find(m => m.includes('realtime.input_config'))
    expect(configMsg).toBeUndefined()
  })

  it('sends input_config after conversation.connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.onopen?.()
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-123', iceServers: [] },
    })
    const configMsg = ws.sentMessages.find(m => m.includes('realtime.input_config'))
    expect(configMsg).toBeDefined()
  })

  it('calls onTranscript when assistant transcript event fires', () => {
    const onTranscript = vi.fn()
    session.onTranscript = onTranscript
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'response.audio_transcript.done',
      data: { transcript: 'Tell me about yourself.' },
    })
    expect(onTranscript).toHaveBeenCalledWith('interviewer', 'Tell me about yourself.')
  })

  it('calls onFunctionCall when function call event fires', () => {
    const onFunctionCall = vi.fn()
    session.onFunctionCall = onFunctionCall
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'realtime.response.function_call_arguments.done',
      data: {
        function_name: 'get_question',
        arguments: JSON.stringify({ specialty: 'internal-medicine', mode: 'behavioral', questionIndex: 0 }),
        call_id: 'call-001',
      },
    })
    expect(onFunctionCall).toHaveBeenCalledWith(
      'get_question',
      { specialty: 'internal-medicine', mode: 'behavioral', questionIndex: 0 },
      'call-001'
    )
  })

  it('handles webrtc.offer and sends webrtc.answer', async () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-123', iceServers: [] },
    })
    ws.simulateMessage({
      type: 'webrtc.offer',
      data: { sdp: 'offer-sdp-content' },
    })
    // Allow microtasks (createAnswer is async)
    await new Promise(r => setTimeout(r, 0))
    const answerMsg = ws.sentMessages.find(m => m.includes('webrtc.answer'))
    expect(answerMsg).toBeDefined()
  })

  it('stores sessionId from connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-xyz', iceServers: [] },
    })
    expect(session.sessionId).toBe('sess-xyz')
  })

  it('disconnect() closes WebSocket and cleans up', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    const closeSpy = vi.spyOn(ws, 'close')
    session.disconnect()
    expect(closeSpy).toHaveBeenCalled()
    expect(session.status).toBe('ended')
  })
})
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/navtalk/session.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 4: Implement NavTalkSession**

```typescript
// src/lib/navtalk/session.ts
import type { SessionStatus, Specialty, InterviewMode } from '../../types/interview'
import { buildSystemPrompt } from '../ai/prompts'
import { INTERVIEW_TOOLS, handleToolCall } from '../ai/tools'
import type { NavTalkInboundEvent } from './events'

export interface NavTalkSessionConfig {
  apiKey: string
  character: string
  instructions: string
  tools: unknown[]
  model?: string
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
}

export class NavTalkSession {
  status: SessionStatus = 'idle'
  sessionId: string | null = null

  onStatusChange?: (status: SessionStatus) => void
  onTranscript?: (speaker: 'interviewer' | 'student', text: string) => void
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void

  private config: NavTalkSessionConfig
  private ws: WebSocket | null = null
  private pc: RTCPeerConnection | null = null

  constructor(config: NavTalkSessionConfig) {
    this.config = config
  }

  connect(): void {
    this.setStatus('connecting')
    const url = `wss://transfer.navtalk.ai/wss/v2/realtime-chat?license=${this.config.apiKey}&character=${this.config.character}`
    this.ws = new WebSocket(url)
    this.ws.onopen = () => {
      // Do NOT send config here — wait for conversation.connected.success
    }
    this.ws.onmessage = (event) => this.handleMessage(event)
    this.ws.onclose = () => this.setStatus('ended')
    this.ws.onerror = () => this.setStatus('error')
  }

  disconnect(): void {
    this.pc?.close()
    this.ws?.close()
    this.pc = null
    this.ws = null
    this.setStatus('ended')
  }

  sendFunctionCallResult(callId: string, result: unknown): void {
    this.send({
      type: 'conversation.item.create',
      data: {
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result),
        },
      },
    })
    this.send({ type: 'response.create', data: {} })
  }

  addAudioChunk(pcm16Base64: string): void {
    this.send({ type: 'input_audio_buffer.append', data: { audio: pcm16Base64 } })
  }

  sendSnapshot(base64Jpeg: string): void {
    this.send({ type: 'realtime.input_image', data: { image: base64Jpeg } })
  }

  private send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private setStatus(status: SessionStatus): void {
    this.status = status
    this.onStatusChange?.(status)
  }

  private handleMessage(event: MessageEvent): void {
    let msg: NavTalkInboundEvent
    try {
      msg = JSON.parse(event.data as string) as NavTalkInboundEvent
    } catch {
      return
    }

    switch (msg.type) {
      case 'conversation.connected.success': {
        const { sessionId, iceServers } = msg.data
        this.sessionId = sessionId
        this.setupWebRTC(iceServers)
        this.send({
          type: 'realtime.input_config',
          data: {
            instructions: this.config.instructions,
            tools: this.config.tools,
            ...(this.config.aiBaseUrl && { baseUrl: this.config.aiBaseUrl }),
            ...(this.config.aiApiKey && { apiKey: this.config.aiApiKey }),
            ...(this.config.aiModel && { model: this.config.aiModel }),
          },
        })
        break
      }
      case 'REALTIME_SESSION_CREATED':
        this.setStatus('connected')
        break
      case 'REALTIME_SESSION_UPDATED':
        this.setStatus('listening')
        break
      case 'webrtc.offer':
        this.handleWebRTCOffer(msg.data.sdp)
        break
      case 'realtime.input_audio_buffer.speech_started':
        this.setStatus('listening')
        break
      case 'response.audio_transcript.done':
        this.onTranscript?.('interviewer', msg.data.transcript)
        this.setStatus('listening')
        break
      case 'conversation.item.input_audio_transcription.completed':
        this.onTranscript?.('student', msg.data.transcript)
        this.setStatus('thinking')
        break
      case 'realtime.response.function_call_arguments.done': {
        const { function_name, arguments: argsStr, call_id } = msg.data
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(argsStr) } catch { /* noop */ }
        this.onFunctionCall?.(function_name, args, call_id)
        break
      }
      case 'error':
        this.setStatus('error')
        break
    }
  }

  private setupWebRTC(iceServers: RTCIceServer[]): void {
    this.pc = new RTCPeerConnection({ iceServers })
    this.pc.ontrack = (event) => {
      // Avatar video/audio stream — handled by AvatarView component
      if (this.onRemoteTrack) this.onRemoteTrack(event.streams[0])
    }
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({ type: 'webrtc.ice_candidate', data: { candidate: event.candidate } })
      }
    }
  }

  // Exposed for AvatarView to attach the remote stream to a <video> element
  onRemoteTrack?: (stream: MediaStream) => void

  addVideoTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.pc?.addTrack(track, stream)
  }

  addAudioTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.pc?.addTrack(track, stream)
  }

  async handleWebRTCOffer(sdp: string): Promise<void> {
    if (!this.pc) return
    await this.pc.setRemoteDescription({ type: 'offer', sdp })
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    this.send({ type: 'webrtc.answer', data: { sdp: answer.sdp } })
  }
}

export function createNavTalkSession(
  specialty: Specialty,
  mode: InterviewMode,
  env: Window['electronEnv']
): NavTalkSession {
  return new NavTalkSession({
    apiKey: env.navtalk.apiKey,
    character: env.navtalk.character,
    instructions: buildSystemPrompt(specialty, mode),
    tools: INTERVIEW_TOOLS,
    aiBaseUrl: env.ai.baseUrl,
    aiApiKey: env.ai.apiKey,
    aiModel: env.ai.model,
  })
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/navtalk/session.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/navtalk/
git commit -m "feat: add NavTalk WebSocket session manager with typed events and WebRTC setup"
```

---

### Task 9: Camera manager

**Files:**
- Create: `omai-interview/src/lib/navtalk/camera.ts`
- Create: `omai-interview/src/lib/navtalk/camera.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/navtalk/camera.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CameraManager } from './camera'

// Mock getUserMedia
const videoTrack = { id: 'v1', stop: vi.fn(), kind: 'video' }
const audioTrack = { id: 'a1', stop: vi.fn(), kind: 'audio' }
const mockStream = {
  getVideoTracks: () => [videoTrack],
  getAudioTracks: () => [audioTrack],
  getTracks: () => [videoTrack, audioTrack],
}
const getUserMediaMock = vi.fn().mockResolvedValue(mockStream)
vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: getUserMediaMock } })

// Mock canvas
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockCtx),
  toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,/9j/test'),
  width: 640,
  height: 360,
}
vi.stubGlobal('document', {
  createElement: vi.fn().mockReturnValue(mockCanvas),
})

describe('CameraManager', () => {
  let manager: CameraManager

  beforeEach(() => {
    manager = new CameraManager()
  })

  afterEach(() => {
    manager.stop()
  })

  it('starts with no stream', () => {
    expect(manager.stream).toBeNull()
  })

  it('acquires stream on start()', async () => {
    await manager.start()
    expect(manager.stream).toBe(mockStream)
  })

  it('calls getUserMedia with video constraints', async () => {
    await manager.start()
    expect(getUserMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ video: expect.any(Object) })
    )
  })

  it('stop() releases all tracks', async () => {
    await manager.start()
    const tracks = [
      ...mockStream.getVideoTracks(),
      ...mockStream.getAudioTracks(),
    ]
    manager.stop()
    tracks.forEach(t => expect(t.stop).toHaveBeenCalled())
  })

  it('captureSnapshot returns base64 JPEG string', async () => {
    await manager.start()
    const videoEl = { videoWidth: 640, videoHeight: 360 } as HTMLVideoElement
    const snapshot = manager.captureSnapshot(videoEl)
    expect(typeof snapshot).toBe('string')
    expect(snapshot).toContain('/9j/test')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/lib/navtalk/camera.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement CameraManager**

```typescript
// src/lib/navtalk/camera.ts

export class CameraManager {
  stream: MediaStream | null = null
  private snapshotCanvas: HTMLCanvasElement | null = null

  async start(): Promise<MediaStream> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15 } },
      audio: true,
    })
    this.snapshotCanvas = document.createElement('canvas')
    this.snapshotCanvas.width = 640
    this.snapshotCanvas.height = 360
    return this.stream
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] ?? null
  }

  getAudioTrack(): MediaStreamTrack | null {
    return this.stream?.getAudioTracks()[0] ?? null
  }

  // Capture a JPEG snapshot from the student's webcam for NavTalk periodic snapshots
  captureSnapshot(videoEl: HTMLVideoElement): string {
    if (!this.snapshotCanvas) return ''
    const ctx = this.snapshotCanvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(videoEl, 0, 0, 640, 360)
    // Returns base64-encoded JPEG without the data URL prefix
    return this.snapshotCanvas
      .toDataURL('image/jpeg', 0.7)
      .replace('data:image/jpeg;base64,', '')
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/lib/navtalk/camera.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/navtalk/camera.ts src/lib/navtalk/camera.test.ts
git commit -m "feat: add CameraManager for getUserMedia, WebRTC track injection, and JPEG snapshots"
```

---

## Chunk 4: Hooks

### Task 10: useTranscript hook

**Files:**
- Create: `omai-interview/src/hooks/useTranscript.ts`
- Create: `omai-interview/src/hooks/useTranscript.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/useTranscript.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranscript } from './useTranscript'

const STORAGE_KEY = 'omai_transcript'

beforeEach(() => {
  localStorage.clear()
})

describe('useTranscript', () => {
  it('starts with empty transcript', () => {
    const { result } = renderHook(() => useTranscript())
    expect(result.current.turns).toHaveLength(0)
  })

  it('addTurn appends a turn', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('interviewer', 'Tell me about yourself.')
    })
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].speaker).toBe('interviewer')
    expect(result.current.turns[0].text).toBe('Tell me about yourself.')
    expect(typeof result.current.turns[0].timestamp).toBe('number')
  })

  it('persists each turn to localStorage', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('student', 'I enjoy patient care.')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].text).toBe('I enjoy patient care.')
  })

  it('clear() resets transcript and localStorage', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('interviewer', 'Question 1')
      result.current.clear()
    })
    expect(result.current.turns).toHaveLength(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('recovers transcript from localStorage on mount', () => {
    const savedTurns = [
      { speaker: 'interviewer', text: 'Recovered question', timestamp: Date.now() }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTurns))
    const { result } = renderHook(() => useTranscript())
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].text).toBe('Recovered question')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/hooks/useTranscript.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement useTranscript**

```typescript
// src/hooks/useTranscript.ts
import { useState, useCallback } from 'react'
import type { TranscriptTurn } from '../types/interview'

const STORAGE_KEY = 'omai_transcript'

function loadFromStorage(): TranscriptTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TranscriptTurn[]
  } catch {
    return []
  }
}

export function useTranscript() {
  const [turns, setTurns] = useState<TranscriptTurn[]>(loadFromStorage)

  const addTurn = useCallback((speaker: TranscriptTurn['speaker'], text: string) => {
    const turn: TranscriptTurn = { speaker, text, timestamp: Date.now() }
    setTurns(prev => {
      const updated = [...prev, turn]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    setTurns([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { turns, addTurn, clear }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/hooks/useTranscript.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTranscript.ts src/hooks/useTranscript.test.ts
git commit -m "feat: add useTranscript hook with localStorage crash recovery"
```

---

### Task 11: useNavtalkSession hook

**Files:**
- Create: `omai-interview/src/hooks/useNavtalkSession.ts`
- Create: `omai-interview/src/hooks/useNavtalkSession.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/useNavtalkSession.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNavtalkSession } from './useNavtalkSession'

// Mock NavTalkSession
const mockSession = {
  status: 'idle' as const,
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendFunctionCallResult: vi.fn(),
  sendSnapshot: vi.fn(),
  onStatusChange: null as any,
  onTranscript: null as any,
  onFunctionCall: null as any,
  onRemoteTrack: null as any,
  addVideoTrack: vi.fn(),
  addAudioTrack: vi.fn(),
}

vi.mock('../lib/navtalk/session', () => ({
  createNavTalkSession: vi.fn(() => mockSession),
}))

vi.mock('../lib/ai/tools', () => ({
  handleToolCall: vi.fn().mockReturnValue({ text: 'Mock question?' }),
}))

const mockEnv = {
  navtalk: { apiKey: 'test', character: 'navtalk.Lauren' },
  ai: { provider: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'test', model: 'test' },
  tts: { provider: 'elevenlabs', elevenlabs: { apiKey: 'test', voiceId: 'test' } },
}
vi.stubGlobal('window', { ...globalThis.window, electronEnv: mockEnv })

describe('useNavtalkSession', () => {
  it('starts with idle status and no session', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    expect(result.current.status).toBe('idle')
  })

  it('startSession creates and connects a session', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    expect(mockSession.connect).toHaveBeenCalled()
  })

  it('endSession disconnects', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    act(() => { result.current.endSession() })
    expect(mockSession.disconnect).toHaveBeenCalled()
  })

  it('status updates when session status changes', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    act(() => { mockSession.onStatusChange('listening') })
    expect(result.current.status).toBe('listening')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/hooks/useNavtalkSession.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement useNavtalkSession**

```typescript
// src/hooks/useNavtalkSession.ts
import { useState, useRef, useCallback } from 'react'
import { createNavTalkSession, NavTalkSession } from '../lib/navtalk/session'
import { handleToolCall } from '../lib/ai/tools'
import { CameraManager } from '../lib/navtalk/camera'
import type { SessionStatus, SessionConfig } from '../types/interview'

interface UseNavtalkSessionOptions extends SessionConfig {
  onTranscript?: (speaker: 'interviewer' | 'student', text: string) => void
  onRemoteStream?: (stream: MediaStream) => void
}

export function useNavtalkSession(options: UseNavtalkSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const sessionRef = useRef<NavTalkSession | null>(null)
  const cameraRef = useRef<CameraManager | null>(null)
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)

  const startSession = useCallback(async () => {
    const env = window.electronEnv
    const session = createNavTalkSession(options.specialty, options.mode, env)
    sessionRef.current = session

    // Start periodic snapshots (every 2 seconds) once session is live
    const startSnapshots = () => {
      snapshotIntervalRef.current = setInterval(() => {
        if (videoElRef.current && camera.stream) {
          const snapshot = camera.captureSnapshot(videoElRef.current)
          if (snapshot) session.sendSnapshot(snapshot)
        }
      }, 2000)
    }

    session.onStatusChange = (s) => {
      setStatus(s)
      if (s === 'listening' && !snapshotIntervalRef.current) {
        startSnapshots()
      }
    }

    session.onTranscript = (speaker, text) => {
      options.onTranscript?.(speaker, text)
    }

    session.onFunctionCall = (name, args, callId) => {
      const result = handleToolCall(name, args)
      session.sendFunctionCallResult(callId, result ?? { error: 'No result' })
    }

    session.onRemoteTrack = (stream) => {
      options.onRemoteStream?.(stream)
    }

    // Start camera
    const camera = new CameraManager()
    cameraRef.current = camera
    try {
      const stream = await camera.start()
      setCameraStream(stream)
      const videoTrack = camera.getVideoTrack()
      const audioTrack = camera.getAudioTrack()
      if (videoTrack) session.addVideoTrack(videoTrack, stream)
      if (audioTrack) session.addAudioTrack(audioTrack, stream)
    } catch (err) {
      console.warn('Camera access failed — proceeding without webcam', err)
    }

    session.connect()
  }, [options])

  const endSession = useCallback(() => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current)
      snapshotIntervalRef.current = null
    }
    cameraRef.current?.stop()
    sessionRef.current?.disconnect()
    sessionRef.current = null
    cameraRef.current = null
  }, [])

  const setVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el
  }, [])

  const toggleMute = useCallback(() => {
    const audioTrack = cameraRef.current?.getAudioTrack()
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
    }
  }, [])

  return { status, cameraStream, startSession, endSession, setVideoElement, toggleMute }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/hooks/useNavtalkSession.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNavtalkSession.ts src/hooks/useNavtalkSession.test.ts
git commit -m "feat: add useNavtalkSession hook (state machine, camera, function calls, snapshots)"
```

---

## Chunk 5: Components + App

### Task 12: Pre-session screen components

**Files:**
- Create: `omai-interview/src/components/PreSession/SpecialtySelector.tsx`
- Create: `omai-interview/src/components/PreSession/ModeSelector.tsx`
- Create: `omai-interview/src/components/PreSession/PreSession.tsx`
- Create: `omai-interview/src/components/PreSession/PreSession.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/PreSession/PreSession.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreSession } from './PreSession'

describe('PreSession', () => {
  it('renders specialty selector', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument()
  })

  it('renders interview mode options', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByText(/Behavioral/i)).toBeInTheDocument()
    expect(screen.getByText(/Clinical/i)).toBeInTheDocument()
  })

  it('renders Start Interview button', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument()
  })

  it('calls onStart with selected specialty and mode', () => {
    const onStart = vi.fn()
    render(<PreSession onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /start interview/i }))
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ specialty: 'internal-medicine' })
    )
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/components/PreSession/PreSession.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement pre-session components**

```typescript
// src/components/PreSession/SpecialtySelector.tsx
import type { Specialty } from '../../types/interview'
import { SPECIALTY_LABELS } from '../../types/interview'

interface Props {
  value: Specialty
  onChange: (v: Specialty) => void
}

export function SpecialtySelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">Residency Specialty</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as Specialty)}
        className="bg-navy-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        {(Object.entries(SPECIALTY_LABELS) as [Specialty, string][]).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  )
}
```

```typescript
// src/components/PreSession/ModeSelector.tsx
import type { InterviewMode } from '../../types/interview'
import { MODE_LABELS } from '../../types/interview'

interface Props {
  value: InterviewMode
  onChange: (v: InterviewMode) => void
}

export function ModeSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">Interview Mode</label>
      <div className="flex gap-3">
        {(Object.entries(MODE_LABELS) as [InterviewMode, string][]).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              value === mode
                ? 'bg-accent-500 border-accent-500 text-navy-900'
                : 'bg-navy-700 border-slate-600 text-slate-300 hover:border-accent-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

```typescript
// src/components/PreSession/PreSession.tsx
import { useState } from 'react'
import { SpecialtySelector } from './SpecialtySelector'
import { ModeSelector } from './ModeSelector'
import type { SessionConfig } from '../../types/interview'

interface Props {
  onStart: (config: SessionConfig) => void
}

export function PreSession({ onStart }: Props) {
  const [specialty, setSpecialty] = useState<SessionConfig['specialty']>('internal-medicine')
  const [mode, setMode] = useState<SessionConfig['mode']>('behavioral')

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-navy-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">OMAI Interview</h1>
          <p className="text-slate-400 text-sm">AI-powered residency mock interview practice</p>
        </div>

        <div className="flex flex-col gap-6">
          <SpecialtySelector value={specialty} onChange={setSpecialty} />
          <ModeSelector value={mode} onChange={setMode} />

          <button
            onClick={() => onStart({ specialty, mode })}
            className="w-full bg-accent-500 hover:bg-accent-400 text-navy-900 font-semibold py-4 rounded-xl transition-colors mt-4"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/components/PreSession/PreSession.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PreSession/
git commit -m "feat: add pre-session screen with specialty selector and interview mode picker"
```

---

### Task 13: Live session screen components

**Files:**
- Create: `omai-interview/src/components/LiveSession/StatusIndicator.tsx`
- Create: `omai-interview/src/components/LiveSession/SessionControls.tsx`
- Create: `omai-interview/src/components/LiveSession/AvatarView.tsx`
- Create: `omai-interview/src/components/LiveSession/StudentCamera.tsx`
- Create: `omai-interview/src/components/LiveSession/LiveSession.tsx`
- Create: `omai-interview/src/components/LiveSession/LiveSession.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/LiveSession/LiveSession.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiveSession } from './LiveSession'

vi.mock('../../hooks/useNavtalkSession', () => ({
  useNavtalkSession: () => ({
    status: 'listening',
    startSession: vi.fn(),
    endSession: vi.fn(),
    setVideoElement: vi.fn(),
    toggleMute: vi.fn(),
  }),
}))

const config = { specialty: 'internal-medicine' as const, mode: 'behavioral' as const }

describe('LiveSession', () => {
  it('renders status indicator', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByText(/listening/i)).toBeInTheDocument()
  })

  it('renders end interview button', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByRole('button', { name: /end interview/i })).toBeInTheDocument()
  })

  it('renders mute button', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
  })

  it('calls onEnd when end interview is clicked', () => {
    const onEnd = vi.fn()
    render(<LiveSession config={config} onEnd={onEnd} onTranscript={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /end interview/i }))
    expect(onEnd).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/components/LiveSession/LiveSession.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement live session components**

```typescript
// src/components/LiveSession/StatusIndicator.tsx
import type { SessionStatus } from '../../types/interview'

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; pulse: boolean }> = {
  idle:         { label: 'Ready',        color: 'bg-slate-500',   pulse: false },
  connecting:   { label: 'Connecting',   color: 'bg-yellow-500',  pulse: true  },
  connected:    { label: 'Connected',    color: 'bg-accent-500',  pulse: false },
  listening:    { label: 'Listening',    color: 'bg-accent-500',  pulse: true  },
  speaking:     { label: 'Speaking',     color: 'bg-blue-500',    pulse: true  },
  thinking:     { label: 'Thinking',     color: 'bg-purple-500',  pulse: true  },
  reconnecting: { label: 'Reconnecting', color: 'bg-yellow-500',  pulse: true  },
  error:        { label: 'Error',        color: 'bg-red-500',     pulse: false },
  ended:        { label: 'Ended',        color: 'bg-slate-500',   pulse: false },
}

interface Props { status: SessionStatus }

export function StatusIndicator({ status }: Props) {
  const { label, color, pulse } = STATUS_CONFIG[status]
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-sm text-slate-300 capitalize">{label}</span>
    </div>
  )
}
```

```typescript
// src/components/LiveSession/SessionControls.tsx
interface Props {
  onEnd: () => void
  onToggleMute: () => void
  isMuted: boolean
}

export function SessionControls({ onEnd, onToggleMute, isMuted }: Props) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className={`px-5 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
          isMuted
            ? 'bg-red-900 border-red-700 text-red-300'
            : 'bg-navy-700 border-slate-600 text-slate-300 hover:border-accent-500'
        }`}
      >
        {isMuted ? '🔇 Muted' : '🎙 Mute'}
      </button>
      <button
        onClick={onEnd}
        aria-label="End Interview"
        className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 border border-red-700 text-white font-medium text-sm transition-colors"
      >
        End Interview
      </button>
    </div>
  )
}
```

```typescript
// src/components/LiveSession/AvatarView.tsx
import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
}

export function AvatarView({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full aspect-video bg-navy-800 rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-500 text-sm">Connecting to interviewer…</div>
        </div>
      )}
    </div>
  )
}
```

```typescript
// src/components/LiveSession/StudentCamera.tsx
import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
  onVideoElement?: (el: HTMLVideoElement) => void
}

export function StudentCamera({ stream, onVideoElement }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (stream) videoRef.current.srcObject = stream
      onVideoElement?.(videoRef.current)
    }
  }, [stream, onVideoElement])

  return (
    <div className="w-32 h-24 bg-navy-800 rounded-xl overflow-hidden border border-slate-700">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  )
}
```

```typescript
// src/components/LiveSession/LiveSession.tsx
import { useState, useCallback, useEffect } from 'react'
import { AvatarView } from './AvatarView'
import { StudentCamera } from './StudentCamera'
import { StatusIndicator } from './StatusIndicator'
import { SessionControls } from './SessionControls'
import { useNavtalkSession } from '../../hooks/useNavtalkSession'
import type { SessionConfig } from '../../types/interview'

interface Props {
  config: SessionConfig
  onEnd: () => void
  onTranscript: (speaker: 'interviewer' | 'student', text: string) => void
}

export function LiveSession({ config, onEnd, onTranscript }: Props) {
  const [avatarStream, setAvatarStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const { status, cameraStream, startSession, endSession, setVideoElement, toggleMute } =
    useNavtalkSession({
      ...config,
      onTranscript,
      onRemoteStream: setAvatarStream,
    })

  // Start session on mount
  useEffect(() => {
    startSession()
    return () => { endSession() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleMute = useCallback(() => {
    toggleMute()
    setIsMuted(m => !m)
  }, [toggleMute])

  const handleEnd = useCallback(() => {
    endSession()
    onEnd()
  }, [endSession, onEnd])

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">OMAI Interview</span>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-400 text-sm capitalize">
            {config.specialty.replace(/-/g, ' ')}
          </span>
        </div>
        <StatusIndicator status={status} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-full max-w-3xl">
          <AvatarView stream={avatarStream} />
        </div>
      </div>

      {/* Controls footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
        {/* Student camera — bottom left */}
        <StudentCamera stream={cameraStream} onVideoElement={setVideoElement} />

        {/* Controls — bottom right */}
        <SessionControls
          onEnd={handleEnd}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/components/LiveSession/LiveSession.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/LiveSession/
git commit -m "feat: add live session screen (avatar view, student camera, status indicator, controls)"
```

---

### Task 14: Post-session screen + App router

**Files:**
- Create: `omai-interview/src/components/PostSession/TranscriptView.tsx`
- Create: `omai-interview/src/components/PostSession/PostSession.tsx`
- Create: `omai-interview/src/components/PostSession/PostSession.test.tsx`
- Modify: `omai-interview/src/App.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/PostSession/PostSession.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PostSession } from './PostSession'
import type { TranscriptTurn, SessionConfig } from '../../types/interview'

const turns: TranscriptTurn[] = [
  { speaker: 'interviewer', text: 'Tell me about yourself.', timestamp: 1000 },
  { speaker: 'student', text: 'I am passionate about medicine.', timestamp: 2000 },
]

const config: SessionConfig = { specialty: 'internal-medicine', mode: 'behavioral' }

describe('PostSession', () => {
  it('renders all transcript turns', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByText('Tell me about yourself.')).toBeInTheDocument()
    expect(screen.getByText('I am passionate about medicine.')).toBeInTheDocument()
  })

  it('labels interviewer and student turns', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByText(/Dr\. Lauren/i)).toBeInTheDocument()
    expect(screen.getByText(/You/i)).toBeInTheDocument()
  })

  it('renders Start New Interview button', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start new interview/i })).toBeInTheDocument()
  })

  it('calls onRestart when button is clicked', () => {
    const onRestart = vi.fn()
    render(<PostSession turns={turns} config={config} onRestart={onRestart} />)
    fireEvent.click(screen.getByRole('button', { name: /start new interview/i }))
    expect(onRestart).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:run -- src/components/PostSession/PostSession.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement post-session components**

```typescript
// src/components/PostSession/TranscriptView.tsx
import type { TranscriptTurn } from '../../types/interview'

interface Props {
  turns: TranscriptTurn[]
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TranscriptView({ turns }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => (
        <div
          key={i}
          className={`flex flex-col gap-1 ${turn.speaker === 'interviewer' ? '' : 'items-end'}`}
        >
          <span className="text-xs text-slate-500">
            {turn.speaker === 'interviewer' ? 'Dr. Lauren' : 'You'} · {formatTime(turn.timestamp)}
          </span>
          <div
            className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              turn.speaker === 'interviewer'
                ? 'bg-navy-700 text-slate-200 rounded-tl-sm'
                : 'bg-accent-500 text-navy-900 font-medium rounded-tr-sm'
            }`}
          >
            {turn.text}
          </div>
        </div>
      ))}
    </div>
  )
}
```

```typescript
// src/components/PostSession/PostSession.tsx
import { TranscriptView } from './TranscriptView'
import type { TranscriptTurn, SessionConfig } from '../../types/interview'
import { SPECIALTY_LABELS, MODE_LABELS } from '../../types/interview'

interface Props {
  turns: TranscriptTurn[]
  config: SessionConfig
  onRestart: () => void
}

export function PostSession({ turns, config, onRestart }: Props) {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div>
          <h2 className="text-white font-semibold">Interview Complete</h2>
          <p className="text-slate-400 text-sm">
            {SPECIALTY_LABELS[config.specialty]} · {MODE_LABELS[config.mode]}
          </p>
        </div>
        <button
          onClick={onRestart}
          className="bg-accent-500 hover:bg-accent-400 text-navy-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          Start New Interview
        </button>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-6">
            Interview Transcript
          </h3>
          {turns.length === 0 ? (
            <p className="text-slate-500 text-sm">No transcript available.</p>
          ) : (
            <TranscriptView turns={turns} />
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:run -- src/components/PostSession/PostSession.test.tsx
```
Expected: PASS

- [ ] **Step 5: Write App.tsx screen router**

```typescript
// src/App.tsx
import { useState } from 'react'
import { PreSession } from './components/PreSession/PreSession'
import { LiveSession } from './components/LiveSession/LiveSession'
import { PostSession } from './components/PostSession/PostSession'
import { useTranscript } from './hooks/useTranscript'
import type { SessionConfig } from './types/interview'

type Screen = 'pre' | 'live' | 'post'

export default function App() {
  const [screen, setScreen] = useState<Screen>('pre')
  const [config, setConfig] = useState<SessionConfig>({
    specialty: 'internal-medicine',
    mode: 'behavioral',
  })
  const { turns, addTurn, clear } = useTranscript()

  const handleStart = (cfg: SessionConfig) => {
    clear()
    setConfig(cfg)
    setScreen('live')
  }

  const handleEnd = () => {
    setScreen('post')
  }

  const handleRestart = () => {
    setScreen('pre')
  }

  return (
    <>
      {screen === 'pre' && <PreSession onStart={handleStart} />}
      {screen === 'live' && (
        <LiveSession
          config={config}
          onEnd={handleEnd}
          onTranscript={addTurn}
        />
      )}
      {screen === 'post' && (
        <PostSession
          turns={turns}
          config={config}
          onRestart={handleRestart}
        />
      )}
    </>
  )
}
```

- [ ] **Step 6: Update src/main.tsx to import CSS**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Run all tests**

```bash
npm run test:run
```
Expected: All tests PASS

- [ ] **Step 8: Start dev server and smoke test**

```bash
npm run dev
```
Open `http://localhost:5173` — verify:
- Pre-session screen renders with specialty selector and mode picker
- Clicking "Start Interview" transitions to live session screen
- Status indicator shows "Connecting"
- "End Interview" transitions to post-session

- [ ] **Step 9: Final commit**

```bash
git add src/
git commit -m "feat: add post-session transcript screen, App router, complete three-screen flow"
```

---

## Final Verification

- [ ] **Run full test suite with coverage**

```bash
npm run coverage
```
Expected: All tests pass; coverage report generated in `coverage/`

- [ ] **Build check**

```bash
npm run build
```
Expected: No TypeScript errors; `dist/` generated

- [ ] **Manual NavTalk integration test** (requires real API keys in `.env`)

1. Copy `.env.example` to `.env` and fill in:
   - `NAVTALK_API_KEY` — from NavTalk dashboard
   - `AI_BASE_URL=https://openrouter.ai/api/v1`
   - `AI_API_KEY` — OpenRouter key
   - `AI_MODEL=anthropic/claude-opus-4-5`
   - `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
2. Run `npm run electron:dev`
3. Select Internal Medicine + Behavioral → Start Interview
4. Verify: avatar video appears, webcam self-view appears
5. Speak a response — verify avatar responds with lip-sync
6. End interview — verify transcript appears on post-session screen

> **NavTalk event name verification required before this step:**
> Open browser DevTools → Network → WS tab during a session.
> Confirm the actual event names match `src/lib/navtalk/events.ts`.
> Update event names in `events.ts` and `session.ts` if they differ.
