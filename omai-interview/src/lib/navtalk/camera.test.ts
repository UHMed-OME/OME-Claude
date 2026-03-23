import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CameraManager } from './camera'

// Mock getUserMedia
const videoTrack = { id: 'v1', stop: vi.fn(), kind: 'video' }
const audioTrack = { id: 'a1', stop: vi.fn(), kind: 'audio' }
const mockStream = {
  getVideoTracks: () => [videoTrack],
  getAudioTracks: () => [audioTrack],
  getTracks: () => [videoTrack, audioTrack],
}
const getUserMediaMock = vi.fn().mockResolvedValue(mockStream)
vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: getUserMediaMock } })

// Mock canvas
const mockCtx = { drawImage: vi.fn() }
const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockCtx),
  toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,/9j/test'),
  width: 640,
  height: 360,
}
vi.stubGlobal('document', {
  createElement: vi.fn().mockReturnValue(mockCanvas),
})

describe('CameraManager', () => {
  let manager: CameraManager

  beforeEach(() => {
    manager = new CameraManager()
  })

  afterEach(() => {
    manager.stop()
  })

  it('starts with no stream', () => {
    expect(manager.stream).toBeNull()
  })

  it('acquires stream on start()', async () => {
    await manager.start()
    expect(manager.stream).toBe(mockStream)
  })

  it('calls getUserMedia with video constraints', async () => {
    await manager.start()
    expect(getUserMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ video: expect.any(Object) })
    )
  })

  it('stop() releases all tracks', async () => {
    await manager.start()
    const tracks = [
      ...mockStream.getVideoTracks(),
      ...mockStream.getAudioTracks(),
    ]
    manager.stop()
    tracks.forEach(t => expect(t.stop).toHaveBeenCalled())
  })

  it('captureSnapshot returns base64 JPEG string', async () => {
    await manager.start()
    const videoEl = { videoWidth: 640, videoHeight: 360 } as HTMLVideoElement
    const snapshot = manager.captureSnapshot(videoEl)
    expect(typeof snapshot).toBe('string')
    expect(snapshot).toContain('/9j/test')
  })
})
