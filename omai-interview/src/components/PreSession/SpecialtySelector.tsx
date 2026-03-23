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
