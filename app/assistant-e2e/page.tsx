"use client"

import { AssistantWidget } from '@/components/assistant/assistant-widget'

export default function AssistantE2EPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Assistant E2E</h1>
        <p className="text-muted-foreground">This page renders only the Assistant widget for end-to-end tests.</p>
      </div>
      <AssistantWidget />
    </div>
  )
}

