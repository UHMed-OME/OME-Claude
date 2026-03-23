export class CameraManager {
  stream: MediaStream | null = null
  private snapshotCanvas: HTMLCanvasElement | null = null

  async start(): Promise<MediaStream> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15 } },
      audio: true,
    })
    this.snapshotCanvas = document.createElement('canvas')
    this.snapshotCanvas.width = 640
    this.snapshotCanvas.height = 360
    return this.stream
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] ?? null
  }

  getAudioTrack(): MediaStreamTrack | null {
    return this.stream?.getAudioTracks()[0] ?? null
  }

  // Capture a JPEG snapshot from the student's webcam for NavTalk periodic snapshots
  captureSnapshot(videoEl: HTMLVideoElement): string {
    if (!this.snapshotCanvas) return ''
    const ctx = this.snapshotCanvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(videoEl, 0, 0, 640, 360)
    // Returns base64-encoded JPEG without the data URL prefix
    return this.snapshotCanvas
      .toDataURL('image/jpeg', 0.7)
      .replace('data:image/jpeg;base64,', '')
  }
}
