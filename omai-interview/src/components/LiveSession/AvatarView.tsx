import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
}

export function AvatarView({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full aspect-video bg-navy-800 rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-500 text-sm">Connecting to interviewer…</div>
        </div>
      )}
    </div>
  )
}
