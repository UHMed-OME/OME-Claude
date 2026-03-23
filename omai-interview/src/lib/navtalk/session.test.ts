import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NavTalkSession } from './session'

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((event: Event) => void) | null = null
  sentMessages: string[] = []

  send(data: string) { this.sentMessages.push(data) }
  close() { this.readyState = 3 }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
  }
}

vi.stubGlobal('WebSocket', MockWebSocket)
vi.stubGlobal('RTCPeerConnection', vi.fn(function () {
  return {
    addTrack: vi.fn(),
    setRemoteDescription: vi.fn(),
    createAnswer: vi.fn().mockResolvedValue({ sdp: 'answer-sdp', type: 'answer' }),
    setLocalDescription: vi.fn(),
    ontrack: null,
    onicecandidate: null,
    close: vi.fn(),
  }
}))

describe('NavTalkSession', () => {
  let session: NavTalkSession

  beforeEach(() => {
    session = new NavTalkSession({
      apiKey: 'test-key',
      character: 'navtalk.Lauren',
      instructions: 'You are a medical interviewer.',
      tools: [],
    })
  })

  it('constructs without connecting', () => {
    expect(session.status).toBe('idle')
  })

  it('transitions to connecting on connect()', () => {
    session.connect()
    expect(session.status).toBe('connecting')
  })

  it('does NOT send input_config on socket open — waits for connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.onopen?.()
    const configMsg = ws.sentMessages.find(m => m.includes('realtime.input_config'))
    expect(configMsg).toBeUndefined()
  })

  it('sends input_config after conversation.connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.onopen?.()
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-123', iceServers: [] },
    })
    const configMsg = ws.sentMessages.find(m => m.includes('realtime.input_config'))
    expect(configMsg).toBeDefined()
  })

  it('calls onTranscript when assistant transcript event fires', () => {
    const onTranscript = vi.fn()
    session.onTranscript = onTranscript
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'response.audio_transcript.done',
      data: { transcript: 'Tell me about yourself.' },
    })
    expect(onTranscript).toHaveBeenCalledWith('interviewer', 'Tell me about yourself.')
  })

  it('calls onFunctionCall when function call event fires', () => {
    const onFunctionCall = vi.fn()
    session.onFunctionCall = onFunctionCall
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'realtime.response.function_call_arguments.done',
      data: {
        function_name: 'get_question',
        arguments: JSON.stringify({ specialty: 'internal-medicine', mode: 'behavioral', questionIndex: 0 }),
        call_id: 'call-001',
      },
    })
    expect(onFunctionCall).toHaveBeenCalledWith(
      'get_question',
      { specialty: 'internal-medicine', mode: 'behavioral', questionIndex: 0 },
      'call-001'
    )
  })

  it('handles webrtc.offer and sends webrtc.answer', async () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-123', iceServers: [] },
    })
    ws.simulateMessage({
      type: 'webrtc.offer',
      data: { sdp: 'offer-sdp-content' },
    })
    // Allow microtasks (createAnswer is async)
    await new Promise(r => setTimeout(r, 0))
    const answerMsg = ws.sentMessages.find(m => m.includes('webrtc.answer'))
    expect(answerMsg).toBeDefined()
  })

  it('stores sessionId from connected.success', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    ws.simulateMessage({
      type: 'conversation.connected.success',
      data: { sessionId: 'sess-xyz', iceServers: [] },
    })
    expect(session.sessionId).toBe('sess-xyz')
  })

  it('disconnect() closes WebSocket and cleans up', () => {
    session.connect()
    const ws = (session as any).ws as MockWebSocket
    const closeSpy = vi.spyOn(ws, 'close')
    session.disconnect()
    expect(closeSpy).toHaveBeenCalled()
    expect(session.status).toBe('ended')
  })
})
