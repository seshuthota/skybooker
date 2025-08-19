/**
 * Browser Compatibility Detector
 * Detects browser capabilities and provides compatibility information for voice features
 */

export interface BrowserCapabilities {
  webrtc: boolean
  getUserMedia: boolean
  audioContext: boolean
  speechRecognition: boolean
  mediaRecorder: boolean
  webAssembly: boolean
  webWorkers: boolean
  localStorage: boolean
  sessionStorage: boolean
  indexedDB: boolean
  websockets: boolean
}

export interface BrowserInfo {
  name: string
  version: string
  engine: string
  platform: string
  mobile: boolean
  capabilities: BrowserCapabilities
  voiceSupported: boolean
  recommendedSettings: RecommendedSettings
}

export interface RecommendedSettings {
  audioQuality: 'high' | 'medium' | 'low'
  enableTranscript: boolean
  useFallback: boolean
  enablePolyfills: boolean
  warnings: string[]
  optimizations: string[]
}

export class CompatibilityDetector {
  private browserInfo: BrowserInfo | null = null

  /**
   * Perform comprehensive browser compatibility detection
   */
  async detect(): Promise<BrowserInfo> {
    if (this.browserInfo) {
      return this.browserInfo
    }

    const capabilities = await this.detectCapabilities()
    const browserInfo = this.detectBrowserInfo()
    const voiceSupported = this.assessVoiceSupport(capabilities)
    const recommendedSettings = this.generateRecommendations(capabilities, browserInfo)

    this.browserInfo = {
      ...browserInfo,
      capabilities,
      voiceSupported,
      recommendedSettings
    }

    console.log('[CompatibilityDetector] Browser analysis complete:', this.browserInfo)
    return this.browserInfo
  }

  /**
   * Detect browser capabilities
   */
  private async detectCapabilities(): Promise<BrowserCapabilities> {
    const capabilities: BrowserCapabilities = {
      webrtc: false,
      getUserMedia: false,
      audioContext: false,
      speechRecognition: false,
      mediaRecorder: false,
      webAssembly: false,
      webWorkers: false,
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      websockets: false
    }

    // WebRTC Support
    capabilities.webrtc = !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    )

    // getUserMedia Support
    capabilities.getUserMedia = !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    )

    // AudioContext Support
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        const testContext = new AudioContextClass()
        await testContext.close()
        capabilities.audioContext = true
      }
    } catch (error) {
      capabilities.audioContext = false
    }

    // Speech Recognition Support
    capabilities.speechRecognition = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )

    // MediaRecorder Support
    capabilities.mediaRecorder = !!(window.MediaRecorder)

    // WebAssembly Support
    capabilities.webAssembly = typeof WebAssembly === 'object'

    // Web Workers Support
    capabilities.webWorkers = typeof Worker !== 'undefined'

    // Storage Support
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      capabilities.localStorage = true
    } catch (error) {
      capabilities.localStorage = false
    }

    try {
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      capabilities.sessionStorage = true
    } catch (error) {
      capabilities.sessionStorage = false
    }

    // IndexedDB Support
    capabilities.indexedDB = !!(
      window.indexedDB ||
      (window as any).webkitIndexedDB ||
      (window as any).mozIndexedDB
    )

    // WebSockets Support
    capabilities.websockets = typeof WebSocket !== 'undefined'

    return capabilities
  }

  /**
   * Detect browser information
   */
  private detectBrowserInfo(): Omit<BrowserInfo, 'capabilities' | 'voiceSupported' | 'recommendedSettings'> {
    const userAgent = navigator.userAgent
    const platform = navigator.platform || 'Unknown'
    const mobile = /Mobi|Android/i.test(userAgent)

    let name = 'Unknown'
    let version = 'Unknown'
    let engine = 'Unknown'

    // Chrome
    if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
      name = 'Chrome'
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Blink'
    }
    // Firefox
    else if (/Firefox/.test(userAgent)) {
      name = 'Firefox'
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Gecko'
    }
    // Safari
    else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      name = 'Safari'
      const match = userAgent.match(/Version\/(\d+\.\d+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'WebKit'
    }
    // Edge
    else if (/Edg/.test(userAgent)) {
      name = 'Edge'
      const match = userAgent.match(/Edg\/(\d+\.\d+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Blink'
    }
    // Internet Explorer
    else if (/Trident/.test(userAgent)) {
      name = 'Internet Explorer'
      const match = userAgent.match(/rv:(\d+\.\d+)/)
      version = match ? match[1] : 'Unknown'
      engine = 'Trident'
    }

    return { name, version, engine, platform, mobile }
  }

  /**
   * Assess overall voice support
   */
  private assessVoiceSupport(capabilities: BrowserCapabilities): boolean {
    // Minimum requirements for voice functionality
    const requiredCapabilities = [
      capabilities.webrtc,
      capabilities.getUserMedia,
      capabilities.audioContext,
      capabilities.websockets
    ]

    // Voice is supported if all required capabilities are available
    return requiredCapabilities.every(cap => cap)
  }

  /**
   * Generate recommendations based on capabilities
   */
  private generateRecommendations(
    capabilities: BrowserCapabilities,
    browserInfo: Omit<BrowserInfo, 'capabilities' | 'voiceSupported' | 'recommendedSettings'>
  ): RecommendedSettings {
    const warnings: string[] = []
    const optimizations: string[] = []
    let audioQuality: 'high' | 'medium' | 'low' = 'high'
    let enableTranscript = false
    let useFallback = false
    let enablePolyfills = false

    // Browser-specific recommendations
    switch (browserInfo.name) {
      case 'Chrome':
        if (parseFloat(browserInfo.version) < 88) {
          warnings.push('Chrome version is outdated. Update for best performance.')
          audioQuality = 'medium'
        }
        optimizations.push('Chrome provides the best voice experience')
        break

      case 'Firefox':
        if (parseFloat(browserInfo.version) < 85) {
          warnings.push('Firefox version may have WebRTC issues. Consider updating.')
          audioQuality = 'medium'
        }
        if (!capabilities.speechRecognition) {
          enableTranscript = true
          warnings.push('Speech recognition not available in Firefox')
        }
        break

      case 'Safari':
        if (parseFloat(browserInfo.version) < 14) {
          warnings.push('Safari version has limited WebRTC support')
          audioQuality = 'low'
          enableTranscript = true
        }
        optimizations.push('Enable microphone access in Safari settings')
        break

      case 'Edge':
        if (parseFloat(browserInfo.version) < 88) {
          warnings.push('Edge version may have compatibility issues')
          audioQuality = 'medium'
        }
        break

      case 'Internet Explorer':
        warnings.push('Internet Explorer is not supported. Please use a modern browser.')
        useFallback = true
        enablePolyfills = true
        break

      default:
        warnings.push('Unknown browser. Voice features may not work as expected.')
        enableTranscript = true
        audioQuality = 'medium'
    }

    // Mobile-specific recommendations
    if (browserInfo.mobile) {
      optimizations.push('Use headphones for better audio quality on mobile')
      audioQuality = audioQuality === 'high' ? 'medium' : audioQuality
      enableTranscript = true
    }

    // Capability-based recommendations
    if (!capabilities.webrtc) {
      warnings.push('WebRTC not supported - voice features will not work')
      useFallback = true
    }

    if (!capabilities.getUserMedia) {
      warnings.push('Microphone access not available')
      useFallback = true
    }

    if (!capabilities.audioContext) {
      warnings.push('Web Audio API not supported - audio quality may be reduced')
      audioQuality = 'low'
    }

    if (!capabilities.localStorage) {
      warnings.push('Local storage not available - settings will not persist')
      optimizations.push('Enable cookies and local storage')
    }

    if (!capabilities.speechRecognition) {
      enableTranscript = true
      optimizations.push('Text transcript recommended')
    }

    // Performance optimizations
    if (!capabilities.webWorkers) {
      warnings.push('Web Workers not supported - performance may be impacted')
      audioQuality = audioQuality === 'high' ? 'medium' : 'low'
    }

    if (!capabilities.webAssembly) {
      optimizations.push('WebAssembly not supported - using JavaScript fallback')
      audioQuality = audioQuality === 'high' ? 'medium' : audioQuality
    }

    return {
      audioQuality,
      enableTranscript,
      useFallback,
      enablePolyfills,
      warnings,
      optimizations
    }
  }

  /**
   * Test actual microphone access
   */
  async testMicrophoneAccess(): Promise<{
    available: boolean
    error?: string
    deviceCount: number
    defaultDevice?: MediaDeviceInfo
  }> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Get audio devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      const defaultDevice = audioInputs.find(device => device.deviceId === 'default') || audioInputs[0]

      // Clean up stream
      stream.getTracks().forEach(track => track.stop())

      return {
        available: true,
        deviceCount: audioInputs.length,
        defaultDevice
      }
    } catch (error: any) {
      return {
        available: false,
        error: error.name || 'Unknown error',
        deviceCount: 0
      }
    }
  }

  /**
   * Test network connectivity and latency
   */
  async testNetworkQuality(): Promise<{
    online: boolean
    latency: number
    quality: 'excellent' | 'good' | 'fair' | 'poor'
    recommendations: string[]
  }> {
    const startTime = Date.now()
    const recommendations: string[] = []

    try {
      // Test basic connectivity
      await fetch(window.location.origin + '/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      })

      const latency = Date.now() - startTime
      let quality: 'excellent' | 'good' | 'fair' | 'poor'

      if (latency < 100) {
        quality = 'excellent'
      } else if (latency < 300) {
        quality = 'good'
      } else if (latency < 1000) {
        quality = 'fair'
        recommendations.push('Network latency is high - consider using text chat for better experience')
      } else {
        quality = 'poor'
        recommendations.push('Network is very slow - voice features may not work well')
        recommendations.push('Try switching to a faster connection')
      }

      return {
        online: navigator.onLine,
        latency,
        quality,
        recommendations
      }
    } catch (error) {
      return {
        online: false,
        latency: -1,
        quality: 'poor',
        recommendations: ['No internet connection detected', 'Voice features require internet access']
      }
    }
  }

  /**
   * Get browser compatibility score (0-100)
   */
  getCompatibilityScore(): number {
    if (!this.browserInfo) {
      return 0
    }

    const { capabilities } = this.browserInfo
    const weights = {
      webrtc: 25,
      getUserMedia: 25,
      audioContext: 15,
      speechRecognition: 10,
      mediaRecorder: 8,
      webAssembly: 5,
      webWorkers: 5,
      localStorage: 3,
      sessionStorage: 2,
      indexedDB: 1,
      websockets: 1
    }

    let score = 0
    let totalWeight = 0

    for (const [capability, weight] of Object.entries(weights)) {
      totalWeight += weight
      if (capabilities[capability as keyof BrowserCapabilities]) {
        score += weight
      }
    }

    return Math.round((score / totalWeight) * 100)
  }

  /**
   * Generate compatibility report
   */
  generateReport(): string {
    if (!this.browserInfo) {
      return 'Browser analysis not yet performed'
    }

    const score = this.getCompatibilityScore()
    const { name, version, capabilities, recommendedSettings } = this.browserInfo

    let report = `
Voice Assistant Compatibility Report
===================================

Browser: ${name} ${version}
Platform: ${this.browserInfo.platform}
Mobile: ${this.browserInfo.mobile ? 'Yes' : 'No'}
Compatibility Score: ${score}/100

Voice Support: ${this.browserInfo.voiceSupported ? '✅ Supported' : '❌ Not Supported'}

Core Capabilities:
- WebRTC: ${capabilities.webrtc ? '✅' : '❌'}
- Microphone Access: ${capabilities.getUserMedia ? '✅' : '❌'}
- Audio Processing: ${capabilities.audioContext ? '✅' : '❌'}
- Real-time Communication: ${capabilities.websockets ? '✅' : '❌'}

Additional Features:
- Speech Recognition: ${capabilities.speechRecognition ? '✅' : '❌'}
- Media Recording: ${capabilities.mediaRecorder ? '✅' : '❌'}
- Web Assembly: ${capabilities.webAssembly ? '✅' : '❌'}
- Local Storage: ${capabilities.localStorage ? '✅' : '❌'}

Recommended Settings:
- Audio Quality: ${recommendedSettings.audioQuality}
- Enable Transcript: ${recommendedSettings.enableTranscript ? 'Yes' : 'No'}
- Use Fallback: ${recommendedSettings.useFallback ? 'Yes' : 'No'}
`

    if (recommendedSettings.warnings.length > 0) {
      report += `\nWarnings:\n${recommendedSettings.warnings.map(w => `⚠️  ${w}`).join('\n')}`
    }

    if (recommendedSettings.optimizations.length > 0) {
      report += `\nOptimizations:\n${recommendedSettings.optimizations.map(o => `💡 ${o}`).join('\n')}`
    }

    return report
  }
}