/**
 * Voice Agent Test Page
 * Test page for development and debugging of the realtime voice agent
 */

import { RealtimeVoiceAgent } from '@/components/voice/realtime-voice-agent'

export default function VoiceTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          SkyBooker Voice Agent Test
        </h1>
        
        <div className="flex justify-center">
          <RealtimeVoiceAgent className="max-w-4xl" />
        </div>
        
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-muted/30 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Start Voice Session" to connect to OpenAI's Realtime API</li>
              <li>Allow microphone permissions when prompted</li>
              <li>Click "Listening..." button or use voice activation to start talking</li>
              <li>Try saying: "Hi Maya, I need to book a flight from New York to Los Angeles"</li>
              <li>Watch the conversation transcript and audio level indicators</li>
              <li>Test interruption by speaking while Maya is responding</li>
              <li>End the session when done testing</li>
            </ol>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This requires a valid OpenAI API key with Realtime API access. 
                Make sure NEXT_PUBLIC_OPENAI_API_KEY is set in your environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}