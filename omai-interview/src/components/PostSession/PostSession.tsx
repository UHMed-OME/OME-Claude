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
