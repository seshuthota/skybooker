/**
 * Production Monitoring System
 * Real-time monitoring and alerting for voice assistant production deployment
 */

export interface PerformanceMetrics {
  connectionTime: number
  audioLatency: number
  errorRate: number
  successRate: number
  averageSessionDuration: number
  concurrentSessions: number
  memoryUsage: number
  cpuUsage: number
}

export interface HealthCheck {
  timestamp: Date
  status: 'healthy' | 'degraded' | 'critical'
  metrics: PerformanceMetrics
  issues: string[]
  recommendations: string[]
}

export interface AlertRule {
  id: string
  name: string
  metric: keyof PerformanceMetrics
  threshold: number
  condition: 'greater_than' | 'less_than'
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

export interface Alert {
  id: string
  ruleId: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  currentValue: number
  threshold: number
  resolved: boolean
  resolvedAt?: Date
}

export class ProductionMonitor {
  private metrics: PerformanceMetrics
  private healthHistory: HealthCheck[] = []
  private alerts: Alert[] = []
  private alertRules: AlertRule[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false

  constructor() {
    this.metrics = {
      connectionTime: 0,
      audioLatency: 0,
      errorRate: 0,
      successRate: 100,
      averageSessionDuration: 0,
      concurrentSessions: 0,
      memoryUsage: 0,
      cpuUsage: 0
    }

    this.initializeDefaultAlertRules()
  }

  /**
   * Initialize default monitoring rules
   */
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'connection_time_high',
        name: 'High Connection Time',
        metric: 'connectionTime',
        threshold: 5000, // 5 seconds
        condition: 'greater_than',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'audio_latency_high',
        name: 'High Audio Latency',
        metric: 'audioLatency',
        threshold: 300, // 300ms
        condition: 'greater_than',
        severity: 'high',
        enabled: true
      },
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        metric: 'errorRate',
        threshold: 10, // 10%
        condition: 'greater_than',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'success_rate_low',
        name: 'Low Success Rate',
        metric: 'successRate',
        threshold: 90, // 90%
        condition: 'less_than',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        metric: 'memoryUsage',
        threshold: 100, // 100MB
        condition: 'greater_than',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'concurrent_sessions_high',
        name: 'High Concurrent Sessions',
        metric: 'concurrentSessions',
        threshold: 50,
        condition: 'greater_than',
        severity: 'low',
        enabled: true
      }
    ]
  }

  /**
   * Start production monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('[ProductionMonitor] Monitoring already active')
      return
    }

    this.isMonitoring = true
    console.log('[ProductionMonitor] Starting production monitoring...')

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, intervalMs)

    // Perform initial health check
    this.performHealthCheck()
  }

  /**
   * Stop production monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('[ProductionMonitor] Monitoring stopped')
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      // Update metrics
      await this.updateMetrics()

      // Evaluate health status
      const { status, issues, recommendations } = this.evaluateHealth()

      // Check alert rules
      this.checkAlertRules()

      const healthCheck: HealthCheck = {
        timestamp: new Date(),
        status,
        metrics: { ...this.metrics },
        issues,
        recommendations
      }

      // Store health check
      this.healthHistory.push(healthCheck)
      
      // Keep only last 100 health checks
      if (this.healthHistory.length > 100) {
        this.healthHistory = this.healthHistory.slice(-100)
      }

      console.log(`[ProductionMonitor] Health check completed in ${Date.now() - startTime}ms - Status: ${status}`)
      
      return healthCheck
    } catch (error) {
      console.error('[ProductionMonitor] Health check failed:', error)
      
      const criticalHealthCheck: HealthCheck = {
        timestamp: new Date(),
        status: 'critical',
        metrics: this.metrics,
        issues: ['Health check system failure'],
        recommendations: ['Restart monitoring system', 'Check system resources']
      }

      this.healthHistory.push(criticalHealthCheck)
      return criticalHealthCheck
    }
  }

  /**
   * Update performance metrics
   */
  private async updateMetrics(): Promise<void> {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    // CPU usage estimation (not directly available in browser)
    const cpuStart = Date.now()
    let iterations = 0
    while (Date.now() - cpuStart < 10) {
      Math.random()
      iterations++
    }
    // Normalize CPU estimate (rough approximation)
    this.metrics.cpuUsage = Math.max(0, Math.min(100, 100 - (iterations / 1000)))

    // Connection time (from session metrics)
    const recentConnections = this.getRecentConnectionTimes()
    if (recentConnections.length > 0) {
      this.metrics.connectionTime = recentConnections.reduce((a, b) => a + b, 0) / recentConnections.length
    }

    // Audio latency (from session metrics)
    const recentLatencies = this.getRecentAudioLatencies()
    if (recentLatencies.length > 0) {
      this.metrics.audioLatency = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length
    }

    // Error and success rates
    const sessionStats = this.getSessionStatistics()
    this.metrics.errorRate = sessionStats.errorRate
    this.metrics.successRate = sessionStats.successRate
    this.metrics.averageSessionDuration = sessionStats.averageSessionDuration
    this.metrics.concurrentSessions = sessionStats.concurrentSessions
  }

  /**
   * Evaluate overall system health
   */
  private evaluateHealth(): { status: 'healthy' | 'degraded' | 'critical', issues: string[], recommendations: string[] } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check critical thresholds
    if (this.metrics.errorRate > 20) {
      issues.push(`Critical error rate: ${this.metrics.errorRate.toFixed(1)}%`)
      recommendations.push('Investigate error patterns and root causes')
    }

    if (this.metrics.successRate < 80) {
      issues.push(`Low success rate: ${this.metrics.successRate.toFixed(1)}%`)
      recommendations.push('Review failed session logs')
    }

    if (this.metrics.connectionTime > 10000) {
      issues.push(`Very slow connections: ${this.metrics.connectionTime.toFixed(0)}ms`)
      recommendations.push('Check network infrastructure and API performance')
    }

    // Check degraded performance thresholds
    if (this.metrics.audioLatency > 500) {
      issues.push(`High audio latency: ${this.metrics.audioLatency.toFixed(0)}ms`)
      recommendations.push('Optimize audio processing pipeline')
    }

    if (this.metrics.memoryUsage > 150) {
      issues.push(`High memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB`)
      recommendations.push('Review memory leaks and optimize resource cleanup')
    }

    if (this.metrics.concurrentSessions > 100) {
      issues.push(`High concurrent load: ${this.metrics.concurrentSessions} sessions`)
      recommendations.push('Consider load balancing or rate limiting')
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (this.metrics.errorRate > 20 || this.metrics.successRate < 80) {
      status = 'critical'
    } else if (issues.length > 0) {
      status = 'degraded'
    }

    return { status, issues, recommendations }
  }

  /**
   * Check alert rules and generate alerts
   */
  private checkAlertRules(): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      const currentValue = this.metrics[rule.metric]
      let shouldAlert = false

      if (rule.condition === 'greater_than' && currentValue > rule.threshold) {
        shouldAlert = true
      } else if (rule.condition === 'less_than' && currentValue < rule.threshold) {
        shouldAlert = true
      }

      if (shouldAlert) {
        this.createAlert(rule, currentValue)
      } else {
        this.resolveAlert(rule.id)
      }
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(rule: AlertRule, currentValue: number): void {
    // Check if alert already exists and is active
    const existingAlert = this.alerts.find(
      alert => alert.ruleId === rule.id && !alert.resolved
    )

    if (existingAlert) return // Alert already active

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ruleId: rule.id,
      timestamp: new Date(),
      severity: rule.severity,
      message: `${rule.name}: ${currentValue.toFixed(1)} ${rule.condition.replace('_', ' ')} ${rule.threshold}`,
      currentValue,
      threshold: rule.threshold,
      resolved: false
    }

    this.alerts.push(alert)
    console.warn(`[ProductionMonitor] ALERT (${rule.severity}): ${alert.message}`)

    // In production, you might want to send this to an external monitoring service
    this.sendToMonitoringService(alert)
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(ruleId: string): void {
    const activeAlert = this.alerts.find(
      alert => alert.ruleId === ruleId && !alert.resolved
    )

    if (activeAlert) {
      activeAlert.resolved = true
      activeAlert.resolvedAt = new Date()
      console.log(`[ProductionMonitor] Alert resolved: ${activeAlert.message}`)
    }
  }

  /**
   * Send alert to external monitoring service
   */
  private sendToMonitoringService(alert: Alert): void {
    // In production, implement integration with monitoring services like:
    // - DataDog
    // - New Relic
    // - Sentry
    // - PagerDuty
    // - Slack webhooks
    
    console.log('[ProductionMonitor] Alert would be sent to monitoring service:', alert)
    
    // Example webhook call (commented out for demo)
    /*
    fetch('/api/monitoring/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(error => {
      console.error('[ProductionMonitor] Failed to send alert:', error)
    })
    */
  }

  /**
   * Get recent connection times (stub - would integrate with actual session data)
   */
  private getRecentConnectionTimes(): number[] {
    // In production, this would pull from actual session metrics
    return [1200, 800, 1500, 900, 1100] // Example data
  }

  /**
   * Get recent audio latencies (stub - would integrate with actual session data)
   */
  private getRecentAudioLatencies(): number[] {
    // In production, this would pull from actual audio metrics
    return [150, 200, 180, 220, 190] // Example data
  }

  /**
   * Get session statistics (stub - would integrate with actual session data)
   */
  private getSessionStatistics(): {
    errorRate: number
    successRate: number
    averageSessionDuration: number
    concurrentSessions: number
  } {
    // In production, this would calculate from real session data
    return {
      errorRate: Math.random() * 5, // 0-5% error rate
      successRate: 95 + Math.random() * 5, // 95-100% success rate
      averageSessionDuration: 180000 + Math.random() * 120000, // 3-5 minute sessions
      concurrentSessions: Math.floor(Math.random() * 20) // 0-20 concurrent sessions
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'critical'
    metrics: PerformanceMetrics
    activeAlerts: number
    lastHealthCheck: Date | null
  } {
    const lastHealthCheck = this.healthHistory.length > 0 
      ? this.healthHistory[this.healthHistory.length - 1] 
      : null

    return {
      status: lastHealthCheck?.status || 'healthy',
      metrics: { ...this.metrics },
      activeAlerts: this.alerts.filter(alert => !alert.resolved).length,
      lastHealthCheck: lastHealthCheck?.timestamp || null
    }
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    currentMetrics: PerformanceMetrics
    healthHistory: HealthCheck[]
    activeAlerts: Alert[]
    alertRules: AlertRule[]
    uptime: number
  } {
    const uptime = this.healthHistory.length > 0 
      ? Date.now() - this.healthHistory[0].timestamp.getTime()
      : 0

    return {
      currentMetrics: { ...this.metrics },
      healthHistory: [...this.healthHistory],
      activeAlerts: this.alerts.filter(alert => !alert.resolved),
      alertRules: [...this.alertRules],
      uptime
    }
  }

  /**
   * Generate production readiness report
   */
  generateProductionReadinessReport(): string {
    const status = this.getSystemStatus()
    const dashboard = this.getDashboardData()

    const report = `
Production Readiness Report
==========================

System Status: ${status.status.toUpperCase()}
Last Health Check: ${status.lastHealthCheck?.toISOString() || 'Never'}
Active Alerts: ${status.activeAlerts}
Uptime: ${Math.round(dashboard.uptime / 1000 / 60)} minutes

Current Metrics:
- Connection Time: ${status.metrics.connectionTime.toFixed(0)}ms
- Audio Latency: ${status.metrics.audioLatency.toFixed(0)}ms  
- Error Rate: ${status.metrics.errorRate.toFixed(1)}%
- Success Rate: ${status.metrics.successRate.toFixed(1)}%
- Memory Usage: ${status.metrics.memoryUsage.toFixed(1)}MB
- Concurrent Sessions: ${status.metrics.concurrentSessions}

Alert Rules (${dashboard.alertRules.filter(r => r.enabled).length} enabled):
${dashboard.alertRules.map(rule => 
  `${rule.enabled ? '✅' : '❌'} ${rule.name}: ${rule.metric} ${rule.condition.replace('_', ' ')} ${rule.threshold} (${rule.severity})`
).join('\n')}

Recent Alerts:
${dashboard.activeAlerts.length === 0 ? 'No active alerts' : 
  dashboard.activeAlerts.map(alert => 
    `⚠️  ${alert.message} (${alert.severity})`
  ).join('\n')}

Production Recommendations:
- Set up external monitoring integration (DataDog, New Relic, etc.)
- Configure alert webhooks for real-time notifications
- Implement log aggregation and analysis
- Set up automated scaling based on concurrent sessions
- Configure health check endpoints for load balancers
- Implement circuit breakers for external API calls
- Set up performance budgets and SLA monitoring
`

    return report
  }
}