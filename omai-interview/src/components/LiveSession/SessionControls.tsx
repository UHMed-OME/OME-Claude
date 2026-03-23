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
