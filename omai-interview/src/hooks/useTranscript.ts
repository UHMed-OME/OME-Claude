import { useState, useCallback } from 'react'
import type { TranscriptTurn } from '../types/interview'

const STORAGE_KEY = 'omai_transcript'

function loadFromStorage(): TranscriptTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TranscriptTurn[]
  } catch {
    return []
  }
}

export function useTranscript() {
  const [turns, setTurns] = useState<TranscriptTurn[]>(loadFromStorage)

  const addTurn = useCallback((speaker: TranscriptTurn['speaker'], text: string) => {
    const turn: TranscriptTurn = { speaker, text, timestamp: Date.now() }
    setTurns(prev => {
      const updated = [...prev, turn]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    setTurns([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { turns, addTurn, clear }
}
