/**
 * Audio Manager for SkyBooker Voice Agent
 * Handles microphone capture, audio playback, and WebRTC audio streaming
 */

import { AudioState, VoiceSettings, VoiceError } from '@/types/voice'

export class AudioManager {
  private audioContext: AudioContext | null = null
  private microphoneStream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private audioLevel: number = 0
  private isCapturing: boolean = false
  private isPlaying: boolean = false
  private devices: MediaDeviceInfo[] = []
  private settings: VoiceSettings
  private onAudioLevelUpdate?: (level: number) => void
  private onError?: (error: VoiceError) => void

  constructor(
    settings: VoiceSettings,
    onAudioLevelUpdate?: (level: number) => void,
    onError?: (error: VoiceError) => void
  ) {
    this.settings = settings
    this.onAudioLevelUpdate = onAudioLevelUpdate
    this.onError = onError
  }

  /**
   * Initialize audio context and enumerate devices
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Request microphone permissions and enumerate devices
      await this.requestMicrophonePermission()
      await this.enumerateDevices()
      
      console.log('[AudioManager] Initialized successfully')
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'AUDIO_INIT_FAILED',
        message: 'Failed to initialize audio system',
        details: error,
        timestamp: new Date(),
        recoverable: false
      }
      this.onError?.(voiceError)
      throw error
    }
  }

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSupression,
          autoGainControl: true
        } 
      })
      
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      throw new Error('Microphone permission denied or unavailable')
    }
  }

  /**
   * Enumerate available audio devices
   */
  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.devices = devices.filter(device => 
        device.kind === 'audioinput' || device.kind === 'audiooutput'
      )
      return this.devices
    } catch (error) {
      console.error('[AudioManager] Failed to enumerate devices:', error)
      return []
    }
  }

  /**
   * Start capturing audio from microphone
   */
  async startCapture(): Promise<MediaStream> {
    try {
      if (this.isCapturing && this.microphoneStream) {
        return this.microphoneStream
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSupression,
          autoGainControl: true,
          deviceId: this.settings.microphoneId ? { exact: this.settings.microphoneId } : undefined
        }
      }

      this.microphoneStream = await navigator.mediaDevices.getUserMedia(constraints)
      this.isCapturing = true

      // Set up audio level monitoring
      if (this.audioContext && this.microphoneStream) {
        await this.setupAudioLevelMonitoring()
      }

      console.log('[AudioManager] Started audio capture')
      return this.microphoneStream
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'CAPTURE_START_FAILED',
        message: 'Failed to start audio capture',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      this.onError?.(voiceError)
      throw error
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
    this.isCapturing = false
    this.audioLevel = 0
    console.log('[AudioManager] Stopped audio capture')
  }

  /**
   * Set up audio level monitoring for visual feedback
   */
  private async setupAudioLevelMonitoring(): Promise<void> {
    if (!this.audioContext || !this.microphoneStream) return

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream)
      this.analyser = this.audioContext.createAnalyser()
      
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      
      source.connect(this.analyser)

      // Start monitoring audio level
      this.monitorAudioLevel()
    } catch (error) {
      console.error('[AudioManager] Failed to set up audio monitoring:', error)
    }
  }

  /**
   * Monitor audio level for visual feedback
   */
  private monitorAudioLevel(): void {
    if (!this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    
    const updateLevel = () => {
      if (!this.analyser || !this.isCapturing) return

      this.analyser.getByteFrequencyData(dataArray)
      
      // Calculate RMS value for audio level
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      
      const rms = Math.sqrt(sum / dataArray.length)
      this.audioLevel = Math.min(100, (rms / 128) * 100) // Normalize to 0-100
      
      this.onAudioLevelUpdate?.(this.audioLevel)
      
      requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
  }

  /**
   * Play audio from a URL or blob
   */
  async playAudio(audioData: string | Blob | ArrayBuffer): Promise<void> {
    try {
      this.isPlaying = true
      
      let audioUrl: string
      
      if (typeof audioData === 'string') {
        audioUrl = audioData
      } else if (audioData instanceof Blob) {
        audioUrl = URL.createObjectURL(audioData)
      } else {
        const blob = new Blob([audioData], { type: 'audio/wav' })
        audioUrl = URL.createObjectURL(blob)
      }

      const audio = new Audio(audioUrl)
      audio.volume = this.settings.speakerVolume / 100
      
      // Set audio output device if specified
      if (this.settings.speakerId && 'setSinkId' in audio) {
        try {
          await (audio as any).setSinkId(this.settings.speakerId)
        } catch (error) {
          console.warn('[AudioManager] Failed to set audio output device:', error)
        }
      }

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this.isPlaying = false
          if (audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl)
          }
          resolve()
        }
        
        audio.onerror = (error) => {
          this.isPlaying = false
          if (audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl)
          }
          reject(error)
        }
        
        audio.play().catch(reject)
      })
    } catch (error) {
      this.isPlaying = false
      const voiceError: VoiceError = {
        code: 'AUDIO_PLAYBACK_FAILED',
        message: 'Failed to play audio',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      this.onError?.(voiceError)
      throw error
    }
  }

  /**
   * Update voice settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  /**
   * Get current audio state
   */
  getState(): AudioState {
    return {
      isCapturing: this.isCapturing,
      isPlaying: this.isPlaying,
      microphoneStream: this.microphoneStream,
      audioContext: this.audioContext,
      audioLevel: this.audioLevel,
      devices: this.devices
    }
  }

  /**
   * Check if audio is supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      (window.AudioContext || (window as any).webkitAudioContext)
    )
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopCapture()
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioContext = null
    this.analyser = null
    this.devices = []
    
    console.log('[AudioManager] Disposed')
  }
}