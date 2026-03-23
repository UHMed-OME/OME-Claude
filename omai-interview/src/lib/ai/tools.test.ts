// src/lib/ai/tools.test.ts
import { describe, it, expect } from 'vitest'
import { INTERVIEW_TOOLS, handleToolCall } from './tools'

describe('INTERVIEW_TOOLS', () => {
  it('exports an array with get_question tool', () => {
    expect(Array.isArray(INTERVIEW_TOOLS)).toBe(true)
    const tool = INTERVIEW_TOOLS.find(t => t.name === 'get_question')
    expect(tool).toBeDefined()
  })

  it('get_question has valid JSON Schema parameters', () => {
    const tool = INTERVIEW_TOOLS.find(t => t.name === 'get_question')!
    const params = tool.parameters
    expect(params.type).toBe('object')
    expect(params.properties.specialty.type).toBe('string')
    expect(Array.isArray(params.properties.specialty.enum)).toBe(true)
    expect(params.properties.mode.type).toBe('string')
    expect(Array.isArray(params.properties.mode.enum)).toBe(true)
    expect(params.properties.mode.enum).not.toContain('mixed')
    expect(params.properties.questionIndex.type).toBe('number')
    expect(params.required).toContain('specialty')
    expect(params.required).toContain('mode')
    expect(params.required).toContain('questionIndex')
  })
})

describe('handleToolCall', () => {
  it('returns a question for get_question', () => {
    const result = handleToolCall('get_question', {
      specialty: 'internal-medicine',
      mode: 'behavioral',
      questionIndex: 0,
    })
    expect(result).toBeDefined()
    expect(result.text).toBeTruthy()
  })

  it('returns null for unknown tool', () => {
    const result = handleToolCall('unknown_tool', {})
    expect(result).toBeNull()
  })

  it('returns null for out-of-bounds question index', () => {
    const result = handleToolCall('get_question', {
      specialty: 'internal-medicine',
      mode: 'behavioral',
      questionIndex: 9999,
    })
    expect(result).toBeNull()
  })
})
