// src/lib/ai/questionBank.test.ts
import { describe, it, expect } from 'vitest'
import { getQuestions, getQuestion, QUESTION_BANK } from './questionBank'

describe('QUESTION_BANK', () => {
  it('has questions for all 6 specialties', () => {
    const specialties = ['internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine']
    for (const s of specialties) {
      const qs = QUESTION_BANK.filter(q => q.specialty === s)
      expect(qs.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('has both behavioral and clinical questions for each specialty', () => {
    const specialties = ['internal-medicine', 'general-surgery', 'psychiatry',
      'pediatrics', 'emergency-medicine', 'family-medicine']
    for (const s of specialties) {
      const behavioral = QUESTION_BANK.filter(q => q.specialty === s && q.mode === 'behavioral')
      const clinical = QUESTION_BANK.filter(q => q.specialty === s && q.mode === 'clinical')
      expect(behavioral.length).toBeGreaterThanOrEqual(3)
      expect(clinical.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('has unique IDs', () => {
    const ids = QUESTION_BANK.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getQuestions', () => {
  it('filters by specialty and mode', () => {
    const results = getQuestions('internal-medicine', 'behavioral')
    expect(results.every(q => q.specialty === 'internal-medicine')).toBe(true)
    expect(results.every(q => q.mode === 'behavioral')).toBe(true)
  })

  it('returns questions for mixed mode (both behavioral and clinical)', () => {
    const results = getQuestions('internal-medicine', 'mixed')
    const hasBehavioral = results.some(q => q.mode === 'behavioral')
    const hasClinical = results.some(q => q.mode === 'clinical')
    expect(hasBehavioral).toBe(true)
    expect(hasClinical).toBe(true)
  })
})

describe('getQuestion', () => {
  it('returns question at index', () => {
    const q = getQuestion('internal-medicine', 'behavioral', 0)
    expect(q).toBeDefined()
    expect(q!.specialty).toBe('internal-medicine')
  })

  it('returns undefined for out-of-bounds index', () => {
    const q = getQuestion('internal-medicine', 'behavioral', 9999)
    expect(q).toBeUndefined()
  })
})
