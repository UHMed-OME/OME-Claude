// Bridges ElevenLabs PCM16 audio chunks to a WebRTC MediaStream for NavTalk lip-sync.
// Uses Web Audio API: PCM16 chunks → AudioBufferSourceNode → MediaStreamDestination → RTCPeerConnection.

const SAMPLE_RATE = 16000 // must match ElevenLabs output_format: 'pcm_16000'

export class AudioScheduler {
  private ctx: AudioContext
  private destination: MediaStreamAudioDestinationNode
  private playhead = 0

  readonly stream: MediaStream

  constructor() {
    // Create AudioContext at the ElevenLabs output sample rate to avoid pitch-shifting
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.destination = this.ctx.createMediaStreamDestination()
    this.stream = this.destination.stream
  }

  async scheduleChunk(chunk: Uint8Array): Promise<void> {
    // PCM16 = 2 bytes per sample, signed 16-bit little-endian
    const samples = chunk.length / 2
    const buffer = this.ctx.createBuffer(1, samples, SAMPLE_RATE)
    const channelData = buffer.getChannelData(0)

    const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    for (let i = 0; i < samples; i++) {
      // Convert Int16 → Float32 [-1, 1]
      channelData[i] = dataView.getInt16(i * 2, true) / 32768
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.destination)

    // Schedule at current playhead, or immediately if we're behind real time
    const startTime = Math.max(this.ctx.currentTime, this.playhead)
    source.start(startTime)
    this.playhead = startTime + buffer.duration
  }

  reset(): void {
    this.playhead = 0
  }
}
