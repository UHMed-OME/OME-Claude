// src/lib/ai/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from './prompts'

describe('buildSystemPrompt', () => {
  it('includes specialty name in prompt', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt).toContain('Internal Medicine')
  })

  it('includes behavioral mode instructions', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt.toLowerCase()).toContain('behavioral')
  })

  it('includes clinical mode instructions', () => {
    const prompt = buildSystemPrompt('psychiatry', 'clinical')
    expect(prompt.toLowerCase()).toContain('clinical')
  })

  it('includes mixed mode instructions', () => {
    const prompt = buildSystemPrompt('pediatrics', 'mixed')
    expect(prompt.toLowerCase()).toContain('mixed')
  })

  it('mentions the get_question function tool', () => {
    const prompt = buildSystemPrompt('internal-medicine', 'behavioral')
    expect(prompt).toContain('get_question')
  })

  it('returns a non-empty string', () => {
    const prompt = buildSystemPrompt('emergency-medicine', 'clinical')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(200)
  })
})
