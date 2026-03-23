import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNavtalkSession } from './useNavtalkSession'

// Mock NavTalkSession
const mockSession = {
  status: 'idle' as const,
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendFunctionCallResult: vi.fn(),
  sendSnapshot: vi.fn(),
  onStatusChange: null as any,
  onTranscript: null as any,
  onFunctionCall: null as any,
  onRemoteTrack: null as any,
  addVideoTrack: vi.fn(),
  addAudioTrack: vi.fn(),
}

vi.mock('../lib/navtalk/session', () => ({
  createNavTalkSession: vi.fn(() => mockSession),
}))

vi.mock('../lib/ai/tools', () => ({
  handleToolCall: vi.fn().mockReturnValue({ text: 'Mock question?' }),
}))

const mockEnv = {
  navtalk: { apiKey: 'test', character: 'navtalk.Lauren' },
  ai: { provider: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1', apiKey: 'test', model: 'test' },
  tts: { provider: 'elevenlabs', elevenlabs: { apiKey: 'test', voiceId: 'test' } },
}
vi.stubGlobal('window', { ...globalThis.window, electronEnv: mockEnv })

describe('useNavtalkSession', () => {
  it('starts with idle status and no session', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    expect(result.current.status).toBe('idle')
  })

  it('startSession creates and connects a session', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    expect(mockSession.connect).toHaveBeenCalled()
  })

  it('endSession disconnects', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    act(() => { result.current.endSession() })
    expect(mockSession.disconnect).toHaveBeenCalled()
  })

  it('status updates when session status changes', () => {
    const { result } = renderHook(() =>
      useNavtalkSession({ specialty: 'internal-medicine', mode: 'behavioral' })
    )
    act(() => { result.current.startSession() })
    act(() => { mockSession.onStatusChange('listening') })
    expect(result.current.status).toBe('listening')
  })
})
