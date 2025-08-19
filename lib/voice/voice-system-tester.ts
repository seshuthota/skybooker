/**
 * Voice System Tester
 * Comprehensive testing system for voice functionality across different environments
 */

import { CompatibilityDetector, BrowserInfo } from './compatibility-detector'
import { VoiceErrorHandler } from './error-handler'

export interface TestResult {
  testName: string
  status: 'passed' | 'failed' | 'warning' | 'skipped'
  message: string
  details?: any
  duration: number
  timestamp: Date
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  overallStatus: 'passed' | 'failed' | 'warning'
  totalDuration: number
  summary: {
    passed: number
    failed: number
    warnings: number
    skipped: number
  }
}

export interface SystemHealth {
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  critical_issues: string[]
  recommendations: string[]
  test_suites: TestSuite[]
}

export class VoiceSystemTester {
  private compatibilityDetector: CompatibilityDetector
  private browserInfo: BrowserInfo | null = null

  constructor() {
    this.compatibilityDetector = new CompatibilityDetector()
  }

  /**
   * Run comprehensive system tests
   */
  async runFullTestSuite(): Promise<SystemHealth> {
    console.log('[VoiceSystemTester] Starting comprehensive test suite...')
    const startTime = Date.now()

    // Initialize browser info
    this.browserInfo = await this.compatibilityDetector.detect()

    // Run test suites
    const testSuites: TestSuite[] = [
      await this.testBrowserCompatibility(),
      await this.testNetworkConnectivity(),
      await this.testAudioDevices(),
      await this.testPermissions(),
      await this.testPerformance(),
      await this.testErrorHandling(),
      await this.testAccessibility()
    ]

    const systemHealth = this.generateSystemHealth(testSuites)
    
    console.log('[VoiceSystemTester] Test suite completed in', Date.now() - startTime, 'ms')
    console.log('[VoiceSystemTester] System health score:', systemHealth.score)

    return systemHealth
  }

  /**
   * Test browser compatibility
   */
  private async testBrowserCompatibility(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test WebRTC support
    tests.push(await this.runTest('WebRTC Support', async () => {
      if (!this.browserInfo?.capabilities.webrtc) {
        throw new Error('WebRTC not supported in this browser')
      }
      return 'WebRTC is available'
    }))

    // Test getUserMedia support
    tests.push(await this.runTest('getUserMedia API', async () => {
      if (!this.browserInfo?.capabilities.getUserMedia) {
        throw new Error('getUserMedia not supported')
      }
      return 'Microphone API is available'
    }))

    // Test AudioContext support
    tests.push(await this.runTest('Web Audio API', async () => {
      if (!this.browserInfo?.capabilities.audioContext) {
        throw new Error('Web Audio API not supported')
      }
      return 'Audio processing capabilities available'
    }))

    // Test WebSocket support
    tests.push(await this.runTest('WebSocket Support', async () => {
      if (!this.browserInfo?.capabilities.websockets) {
        throw new Error('WebSockets not supported')
      }
      return 'Real-time communication available'
    }))

    // Test localStorage support
    tests.push(await this.runTest('Local Storage', async () => {
      if (!this.browserInfo?.capabilities.localStorage) {
        throw new Error('localStorage not available')
      }
      localStorage.setItem('voice_test', 'test')
      localStorage.removeItem('voice_test')
      return 'Local storage working correctly'
    }))

    return this.createTestSuite('Browser Compatibility', tests, startTime)
  }

  /**
   * Test network connectivity and quality
   */
  private async testNetworkConnectivity(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test basic connectivity
    tests.push(await this.runTest('Internet Connection', async () => {
      if (!navigator.onLine) {
        throw new Error('No internet connection detected')
      }
      return 'Internet connection available'
    }))

    // Test network latency
    tests.push(await this.runTest('Network Latency', async () => {
      const networkTest = await this.compatibilityDetector.testNetworkQuality()
      if (!networkTest.online) {
        throw new Error('Cannot reach server')
      }
      if (networkTest.latency > 1000) {
        throw new Error(`High latency detected: ${networkTest.latency}ms`)
      }
      if (networkTest.latency > 500) {
        return `Acceptable latency: ${networkTest.latency}ms (consider faster connection)`
      }
      return `Good latency: ${networkTest.latency}ms`
    }))

    // Test HTTPS requirement
    tests.push(await this.runTest('HTTPS Connection', async () => {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('HTTPS required for voice features (except localhost)')
      }
      return 'Secure connection established'
    }))

    // Test CORS and security headers
    tests.push(await this.runTest('Security Headers', async () => {
      try {
        const response = await fetch(window.location.origin, { method: 'HEAD' })
        const headers = response.headers
        
        if (!headers.get('x-content-type-options')) {
          return 'Some security headers missing (non-critical)'
        }
        return 'Security headers properly configured'
      } catch (error) {
        throw new Error('Cannot verify security configuration')
      }
    }))

    return this.createTestSuite('Network Connectivity', tests, startTime)
  }

  /**
   * Test audio devices and permissions
   */
  private async testAudioDevices(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test microphone enumeration
    tests.push(await this.runTest('Audio Device Detection', async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        
        if (audioInputs.length === 0) {
          throw new Error('No microphone devices detected')
        }
        
        return `Found ${audioInputs.length} audio input device(s)`
      } catch (error) {
        throw new Error('Cannot enumerate audio devices')
      }
    }))

    // Test microphone access
    tests.push(await this.runTest('Microphone Access', async () => {
      const micTest = await this.compatibilityDetector.testMicrophoneAccess()
      
      if (!micTest.available) {
        if (micTest.error === 'NotAllowedError') {
          throw new Error('Microphone permission denied')
        } else if (micTest.error === 'NotFoundError') {
          throw new Error('No microphone found')
        } else {
          throw new Error(`Microphone access failed: ${micTest.error}`)
        }
      }
      
      return `Microphone access granted (${micTest.deviceCount} device(s) available)`
    }))

    // Test audio recording capabilities
    tests.push(await this.runTest('Audio Recording', async () => {
      if (!this.browserInfo?.capabilities.mediaRecorder) {
        return 'MediaRecorder not supported (using alternative recording method)'
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        
        // Test basic recording functionality
        recorder.start()
        await new Promise(resolve => setTimeout(resolve, 100))
        recorder.stop()
        
        stream.getTracks().forEach(track => track.stop())
        return 'Audio recording capabilities verified'
      } catch (error) {
        throw new Error('Audio recording test failed')
      }
    }))

    // Test audio playback
    tests.push(await this.runTest('Audio Playback', async () => {
      try {
        const audio = new Audio()
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAT6b3PDFeDEEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAT6b3PDFeDEEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAT6b3PDFeDEEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAT6b3PDFeDEE'
        
        // Test if audio can be loaded
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadeddata', resolve)
          audio.addEventListener('error', reject)
          audio.load()
        })
        
        return 'Audio playback capabilities verified'
      } catch (error) {
        throw new Error('Audio playback test failed')
      }
    }))

    return this.createTestSuite('Audio Devices', tests, startTime)
  }

  /**
   * Test permissions and security
   */
  private async testPermissions(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test microphone permission status
    tests.push(await this.runTest('Microphone Permission', async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        
        if (permission.state === 'denied') {
          throw new Error('Microphone permission denied')
        } else if (permission.state === 'prompt') {
          return 'Microphone permission will be requested when needed'
        } else {
          return 'Microphone permission granted'
        }
      } catch (error) {
        // Fallback for browsers that don't support permissions API
        return 'Permission status cannot be determined (will prompt when needed)'
      }
    }))

    // Test notification permission (for alerts)
    tests.push(await this.runTest('Notification Permission', async () => {
      if (!('Notification' in window)) {
        return 'Notifications not supported (non-critical)'
      }
      
      if (Notification.permission === 'denied') {
        return 'Notification permission denied (non-critical)'
      } else if (Notification.permission === 'granted') {
        return 'Notification permission granted'
      } else {
        return 'Notification permission will be requested if needed'
      }
    }))

    // Test cross-origin isolation (for better performance)
    tests.push(await this.runTest('Cross-Origin Isolation', async () => {
      if (typeof SharedArrayBuffer === 'undefined') {
        return 'Cross-origin isolation not enabled (performance may be reduced)'
      }
      return 'Cross-origin isolation enabled (optimal performance)'
    }))

    return this.createTestSuite('Permissions & Security', tests, startTime)
  }

  /**
   * Test performance characteristics
   */
  private async testPerformance(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test CPU performance
    tests.push(await this.runTest('CPU Performance', async () => {
      const start = performance.now()
      let iterations = 0
      
      // Run CPU-intensive task for 10ms
      while (performance.now() - start < 10) {
        Math.random()
        iterations++
      }
      
      if (iterations < 10000) {
        return 'Slower CPU detected (may affect real-time processing)'
      } else if (iterations < 50000) {
        return 'Moderate CPU performance'
      } else {
        return 'Good CPU performance'
      }
    }))

    // Test memory availability
    tests.push(await this.runTest('Memory Usage', async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
        
        if (usedMB / limitMB > 0.8) {
          return 'High memory usage detected (may affect performance)'
        } else {
          return `Memory usage normal (${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB)`
        }
      } else {
        return 'Memory information not available'
      }
    }))

    // Test Web Workers support
    tests.push(await this.runTest('Web Workers', async () => {
      if (!this.browserInfo?.capabilities.webWorkers) {
        throw new Error('Web Workers not supported (performance will be reduced)')
      }
      
      try {
        const worker = new Worker('data:application/javascript,postMessage("test")')
        
        const response = await new Promise((resolve, reject) => {
          worker.onmessage = (e) => resolve(e.data)
          worker.onerror = reject
          setTimeout(() => reject(new Error('Worker timeout')), 1000)
        })
        
        worker.terminate()
        
        if (response === 'test') {
          return 'Web Workers functioning correctly'
        } else {
          throw new Error('Web Worker communication failed')
        }
      } catch (error) {
        throw new Error('Web Worker test failed')
      }
    }))

    return this.createTestSuite('Performance', tests, startTime)
  }

  /**
   * Test error handling system
   */
  private async testErrorHandling(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test error handler functionality
    tests.push(await this.runTest('Error Handler', async () => {
      const testError = new Error('Test error')
      const result = VoiceErrorHandler.handleError(testError)
      
      if (!result.userMessage || !result.solutions) {
        throw new Error('Error handler not working correctly')
      }
      
      return 'Error handling system functioning correctly'
    }))

    // Test error recovery patterns
    tests.push(await this.runTest('Error Recovery', async () => {
      const connectionError = VoiceErrorHandler.createVoiceError(
        'Connection failed',
        'CONNECTION_FAILED',
        true
      )
      
      const result = VoiceErrorHandler.handleError(connectionError)
      
      if (!result.canRetry || result.solutions.length === 0) {
        throw new Error('Error recovery not properly configured')
      }
      
      return 'Error recovery patterns working correctly'
    }))

    // Test fallback system
    tests.push(await this.runTest('Fallback System', async () => {
      // Simulate critical error that should trigger fallback
      const criticalError = VoiceErrorHandler.createVoiceError(
        'API key invalid',
        'API_KEY_INVALID',
        false
      )
      
      const result = VoiceErrorHandler.handleError(criticalError)
      const fallback = VoiceErrorHandler.getFallbackStrategy(result)
      
      if (fallback.type !== 'immediate' || !fallback.options.includes('text_chat')) {
        throw new Error('Fallback system not properly configured')
      }
      
      return 'Fallback system working correctly'
    }))

    return this.createTestSuite('Error Handling', tests, startTime)
  }

  /**
   * Test accessibility features
   */
  private async testAccessibility(): Promise<TestSuite> {
    const tests: TestResult[] = []
    const startTime = Date.now()

    // Test ARIA support
    tests.push(await this.runTest('ARIA Support', async () => {
      // Test if browser supports ARIA
      const testElement = document.createElement('div')
      testElement.setAttribute('aria-label', 'test')
      
      if (testElement.getAttribute('aria-label') !== 'test') {
        throw new Error('ARIA attributes not supported')
      }
      
      return 'ARIA accessibility features supported'
    }))

    // Test screen reader detection
    tests.push(await this.runTest('Screen Reader Detection', async () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const screenReaders = ['nvda', 'jaws', 'voiceover', 'narrator']
      
      const detected = screenReaders.some(sr => userAgent.includes(sr))
      
      if (detected) {
        return 'Screen reader detected - enhanced accessibility enabled'
      } else {
        return 'No screen reader detected (accessibility features still available)'
      }
    }))

    // Test keyboard navigation
    tests.push(await this.runTest('Keyboard Navigation', async () => {
      // Test if keyboard events are properly supported
      let keyEventSupported = false
      
      const testHandler = () => { keyEventSupported = true }
      document.addEventListener('keydown', testHandler)
      
      // Simulate keyboard event
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      document.dispatchEvent(event)
      
      document.removeEventListener('keydown', testHandler)
      
      if (!keyEventSupported) {
        throw new Error('Keyboard events not properly supported')
      }
      
      return 'Keyboard navigation capabilities verified'
    }))

    // Test color contrast support
    tests.push(await this.runTest('Color Contrast', async () => {
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        return 'High contrast mode detected and supported'
      } else {
        return 'Standard contrast mode (high contrast available if needed)'
      }
    }))

    // Test reduced motion support
    tests.push(await this.runTest('Reduced Motion', async () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'Reduced motion preference detected and will be respected'
      } else {
        return 'Standard motion preferences (reduced motion available if needed)'
      }
    }))

    return this.createTestSuite('Accessibility', tests, startTime)
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(
    testName: string,
    testFunction: () => Promise<string>
  ): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const message = await testFunction()
      return {
        testName,
        status: message.includes('(') || message.includes('may') ? 'warning' : 'passed',
        message,
        duration: Date.now() - startTime,
        timestamp: new Date()
      }
    } catch (error: any) {
      return {
        testName,
        status: 'failed',
        message: error.message || 'Test failed',
        details: error,
        duration: Date.now() - startTime,
        timestamp: new Date()
      }
    }
  }

  /**
   * Create test suite summary
   */
  private createTestSuite(name: string, tests: TestResult[], startTime: number): TestSuite {
    const summary = {
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      warnings: tests.filter(t => t.status === 'warning').length,
      skipped: tests.filter(t => t.status === 'skipped').length
    }

    const overallStatus = summary.failed > 0 ? 'failed' : 
                         summary.warnings > 0 ? 'warning' : 'passed'

    return {
      name,
      tests,
      overallStatus,
      totalDuration: Date.now() - startTime,
      summary
    }
  }

  /**
   * Generate overall system health assessment
   */
  private generateSystemHealth(testSuites: TestSuite[]): SystemHealth {
    const allTests = testSuites.flatMap(suite => suite.tests)
    const totalPassed = allTests.filter(t => t.status === 'passed').length
    const totalFailed = allTests.filter(t => t.status === 'failed').length
    const totalWarnings = allTests.filter(t => t.status === 'warning').length

    // Calculate score (0-100)
    const score = Math.round((totalPassed / allTests.length) * 100)

    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 90 && totalFailed === 0) status = 'excellent'
    else if (score >= 75 && totalFailed <= 2) status = 'good'
    else if (score >= 50) status = 'fair'
    else status = 'poor'

    // Identify critical issues
    const critical_issues = testSuites
      .filter(suite => suite.overallStatus === 'failed')
      .flatMap(suite => suite.tests.filter(t => t.status === 'failed'))
      .map(test => `${test.testName}: ${test.message}`)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (totalFailed > 0) {
      recommendations.push('Address failed tests to improve voice functionality')
    }
    
    if (totalWarnings > 0) {
      recommendations.push('Review warnings for potential improvements')
    }

    if (this.browserInfo && !this.browserInfo.voiceSupported) {
      recommendations.push('Use text chat as primary interface')
      recommendations.push('Consider upgrading to a supported browser')
    }

    if (score < 75) {
      recommendations.push('Voice features may not work optimally in this environment')
    }

    return {
      score,
      status,
      critical_issues,
      recommendations,
      test_suites: testSuites
    }
  }

  /**
   * Generate detailed test report
   */
  generateDetailedReport(systemHealth: SystemHealth): string {
    const { score, status, critical_issues, recommendations, test_suites } = systemHealth

    let report = `
Voice Assistant System Test Report
================================

Overall Score: ${score}/100
System Status: ${status.toUpperCase()}
Test Date: ${new Date().toISOString()}

`

    // Add test suite summaries
    report += 'Test Suite Results:\n'
    for (const suite of test_suites) {
      const icon = suite.overallStatus === 'passed' ? '✅' : 
                   suite.overallStatus === 'warning' ? '⚠️' : '❌'
      report += `${icon} ${suite.name}: ${suite.summary.passed}/${suite.tests.length} passed`
      if (suite.summary.warnings > 0) report += `, ${suite.summary.warnings} warnings`
      if (suite.summary.failed > 0) report += `, ${suite.summary.failed} failed`
      report += `\n`
    }

    // Add critical issues
    if (critical_issues.length > 0) {
      report += '\nCritical Issues:\n'
      for (const issue of critical_issues) {
        report += `❌ ${issue}\n`
      }
    }

    // Add recommendations
    if (recommendations.length > 0) {
      report += '\nRecommendations:\n'
      for (const rec of recommendations) {
        report += `💡 ${rec}\n`
      }
    }

    // Add detailed test results
    report += '\nDetailed Test Results:\n'
    for (const suite of test_suites) {
      report += `\n${suite.name}:\n`
      for (const test of suite.tests) {
        const icon = test.status === 'passed' ? '✅' : 
                     test.status === 'warning' ? '⚠️' : 
                     test.status === 'failed' ? '❌' : '⏭️'
        report += `  ${icon} ${test.testName}: ${test.message} (${test.duration}ms)\n`
      }
    }

    return report
  }
}