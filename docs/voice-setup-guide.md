# Voice Agent Setup Guide

## Prerequisites

To use SkyBooker's voice assistant features, you need:

1. **OpenAI API Key with Realtime API Access**
2. **Microphone permissions in your browser**
3. **Modern browser with WebRTC support**

## Environment Setup

Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Important Notes:**
- The API key must have access to the Realtime API (currently in preview)
- The `NEXT_PUBLIC_` prefix makes this available to the client-side code
- Never commit this file to version control

## Testing the Voice Features

### 1. Text Mode (Default)
- Open the application and click the chat bubble in the bottom-right
- Type messages to interact with Maya
- Use the microphone button for speech-to-text input
- Toggle the sound button to enable/disable text-to-speech responses

### 2. Voice Mode (Realtime)
- In the chat widget, click the "Voice" toggle button
- Allow microphone permissions when prompted
- Click "Start Voice Session" to connect to OpenAI's Realtime API
- Speak naturally to Maya for hands-free interaction

### 3. Mode Switching
- You can switch between Text and Voice modes at any time
- Conversation history is preserved when switching modes
- Voice mode automatically falls back to text mode if there are connection issues

## Troubleshooting

### Common Issues

**"Voice assistant is not configured"**
- Check that `NEXT_PUBLIC_OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding the environment variable

**"Failed to initialize voice system"**
- Ensure microphone permissions are granted
- Check browser compatibility (Chrome, Firefox, Safari 14+)
- Verify WebRTC is not blocked by network/firewall

**"Failed to start voice session"**
- Verify OpenAI API key has Realtime API access
- Check browser console for detailed error messages
- Try refreshing the page and reconnecting

**Audio not working**
- Check browser audio permissions
- Verify speakers/headphones are connected and working
- Test with different audio output devices

### Browser Compatibility

**Fully Supported:**
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

**Limited Support:**
- Older browsers may fall back to text mode only
- Some features may not work on mobile browsers

### Performance Tips

- Use a stable internet connection for best voice quality
- Use headphones to prevent audio feedback
- Ensure good microphone quality for better recognition
- Close other audio applications that might interfere

## Features Available

### Text Mode Features
- ✅ Text chat with Maya
- ✅ Speech-to-text input (browser speech recognition)
- ✅ Text-to-speech responses (Kokori TTS API)
- ✅ Conversation history
- ✅ Voice selection and testing

### Voice Mode Features  
- ✅ Real-time speech-to-speech conversation
- ✅ Low-latency voice interaction
- ✅ Audio level monitoring
- ✅ Connection status indicators
- ✅ Automatic conversation transcription
- ✅ Session management and error recovery

### Coming Soon
- 🔄 Flight search and booking via voice
- 🔄 Multi-agent handoffs (search → booking → support)
- 🔄 Voice activity detection
- 🔄 Custom voice settings and preferences
- 🔄 Voice command shortcuts

## Development

To test voice features in development:

1. Set up the environment variables as described above
2. Run `npm run dev` to start the development server
3. Navigate to the main application or `/voice-test` for standalone testing
4. Open browser developer tools to see detailed logs and debug information

The voice system includes comprehensive logging for debugging:
- `[AudioManager]` - Audio capture and playback events
- `[RealtimeClient]` - OpenAI API communication
- `[SessionManager]` - Voice session orchestration
- `[EnhancedAssistantWidget]` - UI state and mode switching

## Security Notes

- API keys are only used client-side for the Realtime API connection
- Audio data is transmitted directly to OpenAI's servers
- No audio is stored locally or on SkyBooker servers
- All voice data follows OpenAI's privacy and security policies