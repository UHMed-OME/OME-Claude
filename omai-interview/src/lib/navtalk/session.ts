import type { SessionStatus, Specialty, InterviewMode } from '../../types/interview'
import { buildSystemPrompt } from '../ai/prompts'
import { INTERVIEW_TOOLS, handleToolCall } from '../ai/tools'
import type { NavTalkInboundEvent } from './events'

export interface NavTalkSessionConfig {
  apiKey: string
  character: string
  instructions: string
  tools: unknown[]
  model?: string
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
}

export class NavTalkSession {
  status: SessionStatus = 'idle'
  sessionId: string | null = null

  onStatusChange?: (status: SessionStatus) => void
  onTranscript?: (speaker: 'interviewer' | 'student', text: string) => void
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void

  private config: NavTalkSessionConfig
  private ws: WebSocket | null = null
  private pc: RTCPeerConnection | null = null

  constructor(config: NavTalkSessionConfig) {
    this.config = config
  }

  connect(): void {
    this.setStatus('connecting')
    const url = `wss://transfer.navtalk.ai/wss/v2/realtime-chat?license=${this.config.apiKey}&character=${this.config.character}`
    this.ws = new WebSocket(url)
    this.ws.onopen = () => {
      // Do NOT send config here — wait for conversation.connected.success
    }
    this.ws.onmessage = (event) => this.handleMessage(event)
    this.ws.onclose = () => this.setStatus('ended')
    this.ws.onerror = () => this.setStatus('error')
  }

  disconnect(): void {
    this.pc?.close()
    this.ws?.close()
    this.pc = null
    this.ws = null
    this.setStatus('ended')
  }

  sendFunctionCallResult(callId: string, result: unknown): void {
    this.send({
      type: 'conversation.item.create',
      data: {
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result),
        },
      },
    })
    this.send({ type: 'response.create', data: {} })
  }

  addAudioChunk(pcm16Base64: string): void {
    this.send({ type: 'input_audio_buffer.append', data: { audio: pcm16Base64 } })
  }

  sendSnapshot(base64Jpeg: string): void {
    this.send({ type: 'realtime.input_image', data: { image: base64Jpeg } })
  }

  private send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private setStatus(status: SessionStatus): void {
    this.status = status
    this.onStatusChange?.(status)
  }

  private handleMessage(event: MessageEvent): void {
    let msg: NavTalkInboundEvent
    try {
      msg = JSON.parse(event.data as string) as NavTalkInboundEvent
    } catch {
      return
    }

    switch (msg.type) {
      case 'conversation.connected.success': {
        const { sessionId, iceServers } = msg.data
        this.sessionId = sessionId
        this.setupWebRTC(iceServers)
        this.send({
          type: 'realtime.input_config',
          data: {
            instructions: this.config.instructions,
            tools: this.config.tools,
            ...(this.config.aiBaseUrl && { baseUrl: this.config.aiBaseUrl }),
            ...(this.config.aiApiKey && { apiKey: this.config.aiApiKey }),
            ...(this.config.aiModel && { model: this.config.aiModel }),
          },
        })
        break
      }
      case 'REALTIME_SESSION_CREATED':
        this.setStatus('connected')
        break
      case 'REALTIME_SESSION_UPDATED':
        this.setStatus('listening')
        break
      case 'webrtc.offer':
        this.handleWebRTCOffer(msg.data.sdp)
        break
      case 'realtime.input_audio_buffer.speech_started':
        this.setStatus('listening')
        break
      case 'response.audio_transcript.done':
        this.onTranscript?.('interviewer', msg.data.transcript)
        this.setStatus('listening')
        break
      case 'conversation.item.input_audio_transcription.completed':
        this.onTranscript?.('student', msg.data.transcript)
        this.setStatus('thinking')
        break
      case 'realtime.response.function_call_arguments.done': {
        const { function_name, arguments: argsStr, call_id } = msg.data
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(argsStr) } catch { /* noop */ }
        this.onFunctionCall?.(function_name, args, call_id)
        break
      }
      case 'error':
        this.setStatus('error')
        break
    }
  }

  private setupWebRTC(iceServers: RTCIceServer[]): void {
    this.pc = new RTCPeerConnection({ iceServers })
    this.pc.ontrack = (event) => {
      // Avatar video/audio stream — handled by AvatarView component
      if (this.onRemoteTrack) this.onRemoteTrack(event.streams[0])
    }
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({ type: 'webrtc.ice_candidate', data: { candidate: event.candidate } })
      }
    }
  }

  // Exposed for AvatarView to attach the remote stream to a <video> element
  onRemoteTrack?: (stream: MediaStream) => void

  addVideoTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.pc?.addTrack(track, stream)
  }

  addAudioTrack(track: MediaStreamTrack, stream: MediaStream): void {
    this.pc?.addTrack(track, stream)
  }

  async handleWebRTCOffer(sdp: string): Promise<void> {
    if (!this.pc) return
    await this.pc.setRemoteDescription({ type: 'offer', sdp })
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    this.send({ type: 'webrtc.answer', data: { sdp: answer.sdp } })
  }
}

export function createNavTalkSession(
  specialty: Specialty,
  mode: InterviewMode,
  env: Window['electronEnv']
): NavTalkSession {
  return new NavTalkSession({
    apiKey: env.navtalk.apiKey,
    character: env.navtalk.character,
    instructions: buildSystemPrompt(specialty, mode),
    tools: INTERVIEW_TOOLS,
    aiBaseUrl: env.ai.baseUrl,
    aiApiKey: env.ai.apiKey,
    aiModel: env.ai.model,
  })
}
