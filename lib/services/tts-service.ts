interface TTSConfig {
  apiUrl: string
  apiKey?: string
  voice: string
  speed: number
  responseFormat: 'mp3' | 'wav' | 'opus' | 'flac' | 'pcm'
  stream: boolean
}

interface TTSRequest {
  model: string
  input: string
  voice: string
  response_format: string
  speed: number
  stream: boolean
}

export class TTSService {
  private config: TTSConfig
  private audioContext: AudioContext | null = null
  private audioQueue: AudioBuffer[] = []
  private isPlaying = false

  constructor(config: TTSConfig) {
    this.config = config
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  async synthesizeSpeech(text: string): Promise<void> {
    if (!this.audioContext) {
      console.warn('Audio context not available, skipping TTS')
      return
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: this.config.voice,
          speed: this.config.speed,
          format: this.config.responseFormat
        })
      })

      if (!response.ok) {
        console.warn('TTS request failed, continuing without audio')
        return
      }

      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        // TTS service not available, handle gracefully
        const data = await response.json()
        console.log(data.message)
        return
      }

      // Handle audio response
      const arrayBuffer = await response.arrayBuffer()
      if (arrayBuffer.byteLength > 0) {
        await this.processAudioChunk(arrayBuffer)
      }
    } catch (error) {
      console.warn('TTS synthesis failed, continuing without audio:', error)
    }
  }

  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body available')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value && value.length > 0) {
          await this.processAudioChunk(value.buffer)
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private async handleStaticResponse(response: Response): Promise<void> {
    const arrayBuffer = await response.arrayBuffer()
    await this.processAudioChunk(arrayBuffer)
  }

  private async processAudioChunk(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0))
      this.audioQueue.push(audioBuffer)
      
      if (!this.isPlaying) {
        this.playNextChunk()
      }
    } catch (error) {
      console.error('Audio decoding failed:', error)
    }
  }

  private playNextChunk(): void {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const audioBuffer = this.audioQueue.shift()!
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)

    source.onended = () => {
      this.playNextChunk()
    }

    source.start()
  }

  async getAvailableVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v1/audio/voices`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Failed to fetch voices:', error)
      return ['af_heart'] // fallback voice
    }
  }

  stopPlayback(): void {
    this.audioQueue = []
    this.isPlaying = false
    if (this.audioContext) {
      this.audioContext.suspend()
    }
  }

  resumePlayback(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}