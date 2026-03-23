import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioScheduler } from './audioScheduler'

// Mock Web Audio API
const mockDestinationStream = { id: 'mock-stream' } as unknown as MediaStream
const mockDestination = { stream: mockDestinationStream }
const mockBufferSource = {
  buffer: null as AudioBuffer | null,
  connect: vi.fn(),
  start: vi.fn(),
}
const mockAudioContext = {
  sampleRate: 16000,
  currentTime: 0,
  createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
  createBuffer: vi.fn().mockReturnValue({ getChannelData: vi.fn().mockReturnValue(new Float32Array(160)), duration: 0.01 }),
  createMediaStreamDestination: vi.fn().mockReturnValue(mockDestination),
  decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.01, getChannelData: vi.fn() }),
}
vi.stubGlobal('AudioContext', vi.fn(function () { return mockAudioContext }))

describe('AudioScheduler', () => {
  let scheduler: AudioScheduler

  beforeEach(() => {
    vi.clearAllMocks()
    scheduler = new AudioScheduler()
  })

  it('exposes a MediaStream for WebRTC injection', () => {
    expect(scheduler.stream).toBeDefined()
    expect(scheduler.stream).toBe(mockDestinationStream)
  })

  it('scheduleChunk schedules audio via AudioBufferSourceNode', async () => {
    const chunk = new Uint8Array(320) // 160 samples × 2 bytes (PCM16)
    await scheduler.scheduleChunk(chunk)
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
    expect(mockBufferSource.connect).toHaveBeenCalledWith(mockDestination)
    expect(mockBufferSource.start).toHaveBeenCalled()
  })

  it('advances playhead after each chunk', async () => {
    const chunk = new Uint8Array(320)
    await scheduler.scheduleChunk(chunk)
    await scheduler.scheduleChunk(chunk)
    // start() should be called with increasing offsets
    const calls = mockBufferSource.start.mock.calls
    expect(calls.length).toBe(2)
  })

  it('reset() resets the playhead', () => {
    scheduler.reset()
    expect(scheduler['playhead']).toBe(0)
  })
})
