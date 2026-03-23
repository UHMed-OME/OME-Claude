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
