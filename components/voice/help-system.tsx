/**
 * Help System Component
 * Provides contextual help and onboarding for the voice interface
 */

"use client"

import React, { useState, useEffect } from 'react'
import { HelpCircle, Mic, Phone, MessageSquare, Volume2, Wifi, Settings, ChevronRight, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface HelpSystemProps {
  isOpen: boolean
  onClose: () => void
  currentContext?: 'getting_started' | 'troubleshooting' | 'accessibility' | 'features'
  className?: string
}

interface HelpStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: string
  tips?: string[]
}

export function HelpSystem({ 
  isOpen, 
  onClose, 
  currentContext = 'getting_started',
  className = '' 
}: HelpSystemProps) {
  const [activeTab, setActiveTab] = useState(currentContext)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const gettingStartedSteps: HelpStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Maya',
      description: 'Maya is your AI travel assistant who can help you search, book, and manage flights through natural conversation.',
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      tips: [
        'Speak naturally - no special commands needed',
        'Maya remembers your conversation context',
        'You can switch between voice and text anytime'
      ]
    },
    {
      id: 'permissions',
      title: 'Enable Microphone',
      description: 'To use voice features, Maya needs access to your microphone. Click "Allow" when prompted by your browser.',
      icon: <Mic className="h-6 w-6 text-green-600" />,
      action: 'Click "Start Voice Session" to begin',
      tips: [
        'Grant microphone permission for the best experience',
        'Your audio is processed securely and not stored',
        'You can revoke permissions anytime in browser settings'
      ]
    },
    {
      id: 'conversation',
      title: 'Start Talking',
      description: 'Once connected, simply speak naturally to Maya. She can help with flight searches, bookings, and travel questions.',
      icon: <Volume2 className="h-6 w-6 text-purple-600" />,
      tips: [
        'Speak clearly at normal volume',
        'Wait for Maya to finish before responding',
        'The audio level indicator shows when you\'re being heard'
      ]
    },
    {
      id: 'features',
      title: 'Explore Features',
      description: 'Maya can search flights, compare options, handle bookings, manage your trips, and provide travel advice.',
      icon: <Phone className="h-6 w-6 text-orange-600" />,
      tips: [
        'Try: "Find flights from New York to London"',
        'Ask: "What are the cheapest options?"',
        'Say: "Book the morning flight for two passengers"'
      ]
    }
  ]

  const troubleshootingSteps: HelpStep[] = [
    {
      id: 'connection',
      title: 'Connection Issues',
      description: 'If Maya won\'t connect, check your internet connection and browser permissions.',
      icon: <Wifi className="h-6 w-6 text-red-600" />,
      tips: [
        'Refresh the page and try again',
        'Check browser microphone permissions',
        'Try using a different browser or device',
        'Use text chat as a backup option'
      ]
    },
    {
      id: 'audio',
      title: 'Audio Problems',
      description: 'If Maya can\'t hear you or audio quality is poor, try these solutions.',
      icon: <Mic className="h-6 w-6 text-yellow-600" />,
      tips: [
        'Check your microphone is working in other apps',
        'Move closer to your microphone',
        'Reduce background noise',
        'Try using headphones with a built-in mic'
      ]
    },
    {
      id: 'browser',
      title: 'Browser Compatibility',
      description: 'Voice features work best in modern browsers with WebRTC support.',
      icon: <Settings className="h-6 w-6 text-blue-600" />,
      tips: [
        'Chrome, Firefox, Safari, and Edge are fully supported',
        'Update your browser to the latest version',
        'Enable JavaScript and WebRTC',
        'Disable browser extensions that might interfere'
      ]
    }
  ]

  const accessibilityHelp: HelpStep[] = [
    {
      id: 'screen_reader',
      title: 'Screen Reader Support',
      description: 'Maya works with popular screen readers and provides audio announcements.',
      icon: <Volume2 className="h-6 w-6 text-green-600" />,
      tips: [
        'Enable voice announcements in accessibility settings',
        'Maya will announce status changes and responses',
        'Use text chat for full screen reader compatibility',
        'All buttons have descriptive labels'
      ]
    },
    {
      id: 'keyboard',
      title: 'Keyboard Navigation',
      description: 'Navigate the voice interface entirely with keyboard shortcuts.',
      icon: <Settings className="h-6 w-6 text-purple-600" />,
      tips: [
        'Ctrl/Cmd + M: Focus microphone button',
        'Ctrl/Cmd + V: Start/stop voice session',
        'Ctrl/Cmd + T: Toggle transcript view',
        'Tab: Navigate between interface elements'
      ]
    },
    {
      id: 'visual',
      title: 'Visual Accessibility',
      description: 'Customize the visual appearance for better readability.',
      icon: <Settings className="h-6 w-6 text-blue-600" />,
      tips: [
        'Enable high contrast mode for better visibility',
        'Adjust text size to your preference',
        'Turn on reduced motion to minimize animations',
        'Settings are saved across sessions'
      ]
    }
  ]

  const featureGuide: HelpStep[] = [
    {
      id: 'search',
      title: 'Flight Search',
      description: 'Ask Maya to find flights using natural language.',
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      tips: [
        'Say: "I need a flight to Paris next month"',
        'Specify: "Direct flights only" or "Under $500"',
        'Ask: "What\'s the best time to fly?"',
        'Maya will ask clarifying questions as needed'
      ]
    },
    {
      id: 'booking',
      title: 'Flight Booking',
      description: 'Complete your booking through conversation with Maya.',
      icon: <Phone className="h-6 w-6 text-green-600" />,
      tips: [
        'Maya will guide you through passenger details',
        'Have your payment information ready',
        'Review all details before confirming',
        'You\'ll receive email confirmation'
      ]
    },
    {
      id: 'management',
      title: 'Trip Management',
      description: 'Check existing bookings and make changes.',
      icon: <Settings className="h-6 w-6 text-orange-600" />,
      tips: [
        'Say: "Check my upcoming flights"',
        'Ask: "Can I change my seat?"',
        'Request: "Send me my boarding pass"',
        'Maya can help with cancellations and refunds'
      ]
    }
  ]

  const getCurrentSteps = () => {
    switch (activeTab) {
      case 'getting_started': return gettingStartedSteps
      case 'troubleshooting': return troubleshootingSteps
      case 'accessibility': return accessibilityHelp
      case 'features': return featureGuide
      default: return gettingStartedSteps
    }
  }

  const handleStepNavigation = (direction: 'next' | 'prev') => {
    const steps = getCurrentSteps()
    if (direction === 'next' && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const startGuidedTour = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    
    // Simulate guided tour
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const steps = getCurrentSteps()
        if (prev < steps.length - 1) {
          return prev + 1
        } else {
          setIsPlaying(false)
          clearInterval(interval)
          return prev
        }
      })
    }, 3000)
  }

  if (!isOpen) return null

  const currentSteps = getCurrentSteps()
  const step = currentSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-4xl max-h-[90vh] overflow-auto ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <CardTitle>Maya Voice Assistant Help</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Learn how to get the most out of your voice-powered travel assistant
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="getting_started">Getting Started</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Step {currentStep + 1} of {currentSteps.length}</span>
                  <Badge variant="outline">{Math.round(((currentStep + 1) / currentSteps.length) * 100)}% Complete</Badge>
                </div>
                <Progress value={((currentStep + 1) / currentSteps.length) * 100} />
              </div>

              {/* Current Step */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {step.icon}
                    <div className="flex-1 space-y-3">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                      
                      {step.action && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-blue-900">{step.action}</p>
                        </div>
                      )}

                      {step.tips && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Tips:</h4>
                          <ul className="space-y-1">
                            {step.tips.map((tip, index) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStepNavigation('prev')}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStepNavigation('next')}
                    disabled={currentStep === currentSteps.length - 1}
                  >
                    Next
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={isPlaying ? () => setIsPlaying(false) : startGuidedTour}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? 'Pause Tour' : 'Start Guided Tour'}
                  </Button>
                  <Button onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Quick Start</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Jump right into using Maya
                  </p>
                  <Button size="sm" className="w-full">
                    Start Voice Session
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Accessibility</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Customize for your needs
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Open Settings
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Text Chat</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alternative to voice
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Try Text Chat
                  </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}