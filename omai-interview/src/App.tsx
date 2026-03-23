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
