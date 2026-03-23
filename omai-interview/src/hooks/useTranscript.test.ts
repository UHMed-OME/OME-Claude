import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranscript } from './useTranscript'

const STORAGE_KEY = 'omai_transcript'

beforeEach(() => {
  localStorage.clear()
})

describe('useTranscript', () => {
  it('starts with empty transcript', () => {
    const { result } = renderHook(() => useTranscript())
    expect(result.current.turns).toHaveLength(0)
  })

  it('addTurn appends a turn', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('interviewer', 'Tell me about yourself.')
    })
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].speaker).toBe('interviewer')
    expect(result.current.turns[0].text).toBe('Tell me about yourself.')
    expect(typeof result.current.turns[0].timestamp).toBe('number')
  })

  it('persists each turn to localStorage', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('student', 'I enjoy patient care.')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].text).toBe('I enjoy patient care.')
  })

  it('clear() resets transcript and localStorage', () => {
    const { result } = renderHook(() => useTranscript())
    act(() => {
      result.current.addTurn('interviewer', 'Question 1')
      result.current.clear()
    })
    expect(result.current.turns).toHaveLength(0)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('recovers transcript from localStorage on mount', () => {
    const savedTurns = [
      { speaker: 'interviewer', text: 'Recovered question', timestamp: Date.now() }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTurns))
    const { result } = renderHook(() => useTranscript())
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].text).toBe('Recovered question')
  })
})
