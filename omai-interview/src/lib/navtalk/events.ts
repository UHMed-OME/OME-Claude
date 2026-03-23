// NavTalk WebSocket message types (v2 unified connection)
// SOURCE: NavTalk API docs — verify names against NavTalk dashboard before implementation

export type NavTalkInboundEvent =
  | ConnectedSuccessEvent
  | ConnectedWarningEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SpeechStartedEvent
  | TranscriptUserEvent
  | TranscriptAssistantEvent
  | FunctionCallEvent
  | ErrorEvent
  | WebRTCOfferEvent
  | WebRTCIceCandidateEvent

export interface ConnectedSuccessEvent {
  type: 'conversation.connected.success'
  data: {
    sessionId: string
    iceServers: RTCIceServer[]
  }
}

export interface ConnectedWarningEvent {
  type: 'conversation.connected.warning'
  data: { message: string }
}

export interface SessionCreatedEvent {
  type: 'REALTIME_SESSION_CREATED'
  data: Record<string, unknown>
}

export interface SessionUpdatedEvent {
  type: 'REALTIME_SESSION_UPDATED'
  data: Record<string, unknown>
}

export interface SpeechStartedEvent {
  type: 'realtime.input_audio_buffer.speech_started'
  data: Record<string, unknown>
}

// Transcript events — exact names TBD from NavTalk API reference
// These are the most likely names based on OpenAI Realtime API conventions
export interface TranscriptUserEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  data: { transcript: string }
}

export interface TranscriptAssistantEvent {
  type: 'response.audio_transcript.done'
  data: { transcript: string }
}

export interface FunctionCallEvent {
  type: 'realtime.response.function_call_arguments.done'
  data: {
    function_name: string
    arguments: string
    call_id: string
  }
}

export interface ErrorEvent {
  type: 'error'
  data: { message: string; code?: string }
}

export interface WebRTCOfferEvent {
  type: 'webrtc.offer'
  data: { sdp: string }
}

export interface WebRTCIceCandidateEvent {
  type: 'webrtc.ice_candidate'
  data: { candidate: RTCIceCandidateInit }
}

// Outbound message types (app → NavTalk)
export interface InputConfigMessage {
  type: 'realtime.input_config'
  data: {
    instructions: string
    tools: unknown[]
    model?: string
    voice?: string
  }
}

export interface AudioBufferAppendMessage {
  type: 'input_audio_buffer.append'
  data: { audio: string } // base64-encoded PCM16
}

export interface InputImageMessage {
  type: 'realtime.input_image'
  data: { image: string } // base64-encoded JPEG
}

export interface FunctionCallOutputMessage {
  type: 'conversation.item.create'
  data: {
    item: {
      type: 'function_call_output'
      call_id: string
      output: string
    }
  }
}

export interface ResponseCreateMessage {
  type: 'response.create'
  data: Record<string, unknown>
}

export interface WebRTCAnswerMessage {
  type: 'webrtc.answer'
  data: { sdp: string | undefined }
}
