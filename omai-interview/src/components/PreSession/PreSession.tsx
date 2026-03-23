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
