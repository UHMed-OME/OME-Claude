import { useState, useRef, useCallback } from 'react'
import { createNavTalkSession, NavTalkSession } from '../lib/navtalk/session'
import { handleToolCall } from '../lib/ai/tools'
import { CameraManager } from '../lib/navtalk/camera'
import type { SessionStatus, SessionConfig } from '../types/interview'

interface UseNavtalkSessionOptions extends SessionConfig {
  onTranscript?: (speaker: 'interviewer' | 'student', text: string) => void
  onRemoteStream?: (stream: MediaStream) => void
}

export function useNavtalkSession(options: UseNavtalkSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const sessionRef = useRef<NavTalkSession | null>(null)
  const cameraRef = useRef<CameraManager | null>(null)
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoElRef = useRef<HTMLVideoElement | null>(null)

  const startSession = useCallback(async () => {
    const env = window.electronEnv
    const session = createNavTalkSession(options.specialty, options.mode, env)
    sessionRef.current = session

    const camera = new CameraManager()
    cameraRef.current = camera

    // Start periodic snapshots (every 2 seconds) once session is live
    const startSnapshots = () => {
      snapshotIntervalRef.current = setInterval(() => {
        if (videoElRef.current && camera.stream) {
          const snapshot = camera.captureSnapshot(videoElRef.current)
          if (snapshot) session.sendSnapshot(snapshot)
        }
      }, 2000)
    }

    session.onStatusChange = (s) => {
      setStatus(s)
      if (s === 'listening' && !snapshotIntervalRef.current) {
        startSnapshots()
      }
    }

    session.onTranscript = (speaker, text) => {
      options.onTranscript?.(speaker, text)
    }

    session.onFunctionCall = (name, args, callId) => {
      const result = handleToolCall(name, args)
      session.sendFunctionCallResult(callId, result ?? { error: 'No result' })
    }

    session.onRemoteTrack = (stream) => {
      options.onRemoteStream?.(stream)
    }

    // Connect immediately so callers see the transition synchronously
    session.connect()

    // Start camera (non-blocking — add tracks when ready)
    try {
      const stream = await camera.start()
      setCameraStream(stream)
      const videoTrack = camera.getVideoTrack()
      const audioTrack = camera.getAudioTrack()
      if (videoTrack) session.addVideoTrack(videoTrack, stream)
      if (audioTrack) session.addAudioTrack(audioTrack, stream)
    } catch (err) {
      console.warn('Camera access failed — proceeding without webcam', err)
    }
  }, [options])

  const endSession = useCallback(() => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current)
      snapshotIntervalRef.current = null
    }
    cameraRef.current?.stop()
    sessionRef.current?.disconnect()
    sessionRef.current = null
    cameraRef.current = null
  }, [])

  const setVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el
  }, [])

  const toggleMute = useCallback(() => {
    const audioTrack = cameraRef.current?.getAudioTrack()
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
    }
  }, [])

  return { status, cameraStream, startSession, endSession, setVideoElement, toggleMute }
}
