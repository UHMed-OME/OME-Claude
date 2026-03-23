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
