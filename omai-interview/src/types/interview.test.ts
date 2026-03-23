import { describe, it, expect } from 'vitest'
import type { Specialty, InterviewMode, TranscriptTurn, Question } from './interview'

// Verify InterviewMode is a union type
const _modeCheck: InterviewMode = 'behavioral'
void _modeCheck

describe('Specialty type', () => {
  it('accepts all valid specialty strings', () => {
    const specialties: Specialty[] = [
      'internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine',
    ]
    expect(specialties).toHaveLength(6)
  })
})

describe('TranscriptTurn', () => {
  it('has required shape', () => {
    const turn: TranscriptTurn = {
      speaker: 'interviewer',
      text: 'Tell me about yourself.',
      timestamp: Date.now(),
    }
    expect(turn.speaker).toBe('interviewer')
    expect(turn.text).toBeTruthy()
    expect(typeof turn.timestamp).toBe('number')
  })
})

describe('Question', () => {
  it('has required shape', () => {
    const q: Question = {
      id: 'im-b-001',
      specialty: 'internal-medicine',
      mode: 'behavioral',
      text: 'Tell me about a time you managed a difficult patient.',
    }
    expect(q.id).toBe('im-b-001')
    expect(q.followUps).toBeUndefined()
  })
})
