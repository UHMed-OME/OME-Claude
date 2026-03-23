import { useState, useCallback, useEffect } from 'react'
import { AvatarView } from './AvatarView'
import { StudentCamera } from './StudentCamera'
import { StatusIndicator } from './StatusIndicator'
import { SessionControls } from './SessionControls'
import { useNavtalkSession } from '../../hooks/useNavtalkSession'
import type { SessionConfig } from '../../types/interview'

interface Props {
  config: SessionConfig
  onEnd: () => void
  onTranscript: (speaker: 'interviewer' | 'student', text: string) => void
}

export function LiveSession({ config, onEnd, onTranscript }: Props) {
  const [avatarStream, setAvatarStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const { status, cameraStream, startSession, endSession, setVideoElement, toggleMute } =
    useNavtalkSession({
      ...config,
      onTranscript,
      onRemoteStream: setAvatarStream,
    })

  useEffect(() => {
    startSession()
    return () => { endSession() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleMute = useCallback(() => {
    toggleMute()
    setIsMuted(m => !m)
  }, [toggleMute])

  const handleEnd = useCallback(() => {
    endSession()
    onEnd()
  }, [endSession, onEnd])

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">OMAI Interview</span>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-400 text-sm capitalize">
            {config.specialty.replace(/-/g, ' ')}
          </span>
        </div>
        <StatusIndicator status={status} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-full max-w-3xl">
          <AvatarView stream={avatarStream} />
        </div>
      </div>

      {/* Controls footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
        <StudentCamera stream={cameraStream} onVideoElement={setVideoElement} />
        <SessionControls
          onEnd={handleEnd}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      </div>
    </div>
  )
}
