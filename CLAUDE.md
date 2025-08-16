# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
# or
pnpm dev
```

**Build for production:**
```bash
npm run build
# or
pnpm build
```

**Start production server:**
```bash
npm run start
# or
pnpm start
```

**Lint code:**
```bash
npm run lint
# or
pnpm lint
```

## Architecture Overview

**Framework:** Next.js 15 with App Router
**Language:** TypeScript with strict mode
**Styling:** Tailwind CSS 4.x with custom animations
**UI Components:** Radix UI primitives with shadcn/ui component library
**State Management:** React Context for authentication
**Data Storage:** Local storage (simulation layer for development)

## Project Structure

**App Directory Structure:**
- `/app` - Next.js App Router pages and API routes
  - `/api` - Backend API endpoints for auth, bookings, flights, payments, users
  - `/auth` - Authentication pages (signin/signup)
  - `/bookings` - Booking management and confirmation pages
  - `/dashboard` - User dashboard
  - `/flights` - Flight search and booking pages
  - `/profile` - User profile management

**Component Organization:**
- `/components/ui` - Base UI components (shadcn/ui)
- `/components/auth` - Authentication-related components
- `/components/bookings` - Booking-related components
- `/components/flights` - Flight search and booking components
- `/components/payment` - Payment method components
- `/components/profile` - Profile management components
- `/components/support` - Support widget components

**Key Directories:**
- `/hooks` - Custom React hooks (auth, mobile, toast)
- `/lib` - Utility functions and configurations
- `/styles` - Global CSS and Tailwind configurations

## Authentication System

The app uses a Context-based authentication system with localStorage simulation:
- AuthProvider wraps the entire application
- User data stored in localStorage as `skyBooker_user`
- User registration data stored as `skyBooker_users` array
- Authentication state managed through `use-auth.tsx` hook

## AI Assistant System

**Architecture:**
- Custom AI assistant replaces ElevenLabs ConvAI widget
- Combines OpenAI-compatible LLM with Kokori TTS API
- Supports both text and voice interactions

**Services:**
- `TTSService` - Kokori API integration with streaming audio
- `LLMService` - OpenAI-compatible API with conversation management
- `AssistantService` - Orchestrates LLM + TTS workflow

**Components:**
- `AssistantWidget` - Main floating chat interface
- `ChatInterface` - Text conversation with message history
- `VoiceControls` - Speech recognition and audio controls

**Environment Variables:**
```
NEXT_PUBLIC_OPENAI_API_KEY - LLM provider API key
NEXT_PUBLIC_OPENAI_BASE_URL - Custom LLM endpoint (optional)
NEXT_PUBLIC_KOKORI_API_URL - TTS service endpoint  
NEXT_PUBLIC_KOKORI_API_KEY - TTS API key (optional)
```

## Development Notes

- ESLint and TypeScript errors are ignored during builds (see next.config.mjs)
- Images are unoptimized for development purposes
- Custom font loading: Source Sans 3 and Playfair Display
- Path aliasing: `@/*` maps to project root
- Assistant supports real-time streaming responses with audio synthesis