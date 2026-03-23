/// <reference types="vite/client" />

interface ElectronEnv {
  navtalk: {
    apiKey: string
    character: string
  }
  ai: {
    provider: string
    baseUrl: string
    apiKey: string
    model: string
  }
  tts: {
    provider: string
    elevenlabs: {
      apiKey: string
      voiceId: string
    }
  }
}

interface Window {
  electronEnv: ElectronEnv
}
