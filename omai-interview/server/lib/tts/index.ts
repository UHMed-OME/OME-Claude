export interface TTSProvider {
  synthesize(text: string): Promise<ArrayBuffer>
  synthesizeStream(text: string): AsyncIterable<Uint8Array>
}
