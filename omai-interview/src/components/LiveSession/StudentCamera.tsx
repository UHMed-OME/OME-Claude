import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
  onVideoElement?: (el: HTMLVideoElement) => void
}

export function StudentCamera({ stream, onVideoElement }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (stream) videoRef.current.srcObject = stream
      onVideoElement?.(videoRef.current)
    }
  }, [stream, onVideoElement])

  return (
    <div className="w-32 h-24 bg-navy-800 rounded-xl overflow-hidden border border-slate-700">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  )
}
