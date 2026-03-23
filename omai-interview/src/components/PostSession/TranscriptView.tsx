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
