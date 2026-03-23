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
