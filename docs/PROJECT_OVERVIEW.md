# SkyBooker - AI-Powered Flight Booking Platform

## Project Overview

SkyBooker is a modern, intelligent flight booking platform that combines traditional web-based flight search and booking capabilities with an advanced AI assistant powered by OpenAI-compatible LLMs and text-to-speech technology. The platform enables users to book flights through both conventional web interfaces and natural language conversations with an AI assistant named Maya.

### Vision & Mission
- **Vision**: Revolutionize travel booking through conversational AI and seamless user experiences
- **Mission**: Provide an intuitive, accessible, and efficient flight booking platform that understands natural language and automates complex booking workflows

### Key Differentiators
- **Conversational AI Booking**: Users can book flights using natural language with voice and text interactions
- **Intelligent Function Calling**: AI assistant can execute real booking operations, not just provide information
- **Seamless Integration**: AI assistant is deeply integrated with the booking system, able to search flights, create bookings, and manage user accounts
- **Modern Architecture**: Built with Next.js 15, TypeScript, and modern React patterns

---

## Technical Architecture

### Technology Stack

**Frontend Framework:**
- Next.js 15 with App Router architecture
- React 19 with TypeScript (strict mode)
- Tailwind CSS 4.x for styling with custom animations

**UI Components & Design:**
- Radix UI primitives for accessibility and flexibility
- shadcn/ui component library for consistent design
- Lucide React for iconography
- Custom animations with tailwindcss-animate

**Backend & Data:**
- Next.js API Routes for serverless backend
- SQLite database with sqlite3 and sqlite packages
- Zod for runtime validation and type safety
- Custom migration system for database schema evolution

**AI & Assistant Technology:**
- OpenAI-compatible LLM integration with configurable providers
- Kokori TTS API for text-to-speech synthesis
- Custom function calling system with validation and execution
- Real-time streaming responses for voice interactions

**Development & Testing:**
- TypeScript for type safety across the entire stack
- Jest with React Testing Library for comprehensive testing
- Custom testing utilities for AI function testing
- E2E testing for critical user flows

### Architecture Patterns

**Modular Service Architecture:**
- Separation of concerns with dedicated services for AI, database, and business logic
- Service layer abstraction for external API integrations
- Configurable provider system for LLM and TTS services

**Component-Based Design:**
- Atomic design principles with reusable UI components
- Feature-based component organization
- Custom hooks for state management and business logic

**Function-Driven AI System:**
- Declarative function definitions with OpenAI-compatible schemas
- Runtime validation and sanitization of function parameters
- Centralized function registry and execution engine
- Context-aware user authentication and authorization

---

## Core Features & Modules

### 1. User Authentication & Management
- **User Registration & Sign-in**: Email-based authentication with secure password handling
- **Profile Management**: User profile with personal information, preferences, and booking history
- **Session Management**: Context-based authentication using React Context API
- **Data Persistence**: User data stored in SQLite with proper normalization

### 2. Flight Search & Discovery
- **Intelligent Search**: Multi-criteria flight search with origin, destination, dates, and preferences
- **Flexible Querying**: Support for city names, airport codes, and natural language descriptions
- **Mock Flight Data**: Comprehensive flight inventory with major airlines and routes
- **Search Results Display**: Rich flight information with pricing, duration, and airline details

### 3. Booking Management System
- **Complete Booking Workflow**: From search to confirmation with payment integration
- **Multi-Passenger Support**: Handle bookings for multiple travelers with individual passenger details
- **Booking History**: Comprehensive booking management with status tracking
- **Confirmation System**: Detailed booking confirmations with QR codes and e-tickets

### 4. AI Assistant Integration (Maya)
- **Natural Language Processing**: Understand complex travel requests in conversational format
- **Voice Interaction**: Speech-to-text input and text-to-speech responses
- **Function Execution**: Capable of performing real booking operations through function calling
- **Context Awareness**: Maintains conversation context and user authentication state
- **Multi-Modal Communication**: Supports both text and voice interactions seamlessly

### 5. Dashboard & Analytics
- **User Dashboard**: Comprehensive overview of bookings, spending, and travel patterns
- **Travel Insights**: Analytics on travel frequency, favorite destinations, and spending habits
- **Booking Statistics**: Active bookings, past trips, total spending, and miles flown
- **Quick Actions**: Easy access to common tasks like searching flights and managing bookings

### 6. Payment & Financial Management
- **Payment Methods**: Support for saved payment methods and secure payment processing
- **Pricing Transparency**: Clear breakdown of flight costs, taxes, and fees
- **Financial Tracking**: Historical spending analysis and budget insights
- **Secure Processing**: PCI-compliant payment handling (simulation layer for development)

---

## AI Assistant System (Key Innovation)

### Architecture Overview
The AI assistant system is the core innovation of SkyBooker, enabling users to book flights through natural conversation. The system combines multiple technologies to create a seamless conversational booking experience.

### Component Architecture

**LLM Service Layer:**
- **Provider Abstraction**: Configurable support for OpenAI, Anthropic, and custom LLM endpoints
- **Model Management**: Dynamic model selection with provider-specific optimizations
- **Parameter Control**: Fine-tuned temperature, token limits, and response formatting
- **Error Handling**: Robust error handling with fallback strategies

**Text-to-Speech Integration:**
- **Kokori TTS API**: High-quality voice synthesis with multiple voice options
- **Streaming Audio**: Real-time audio generation for responsive voice interactions
- **Voice Selection**: Multiple voice personalities with configurable speech parameters
- **Audio Format Support**: Multiple audio formats (MP3, WAV, Opus, FLAC)

**Function Calling System:**
- **Declarative Functions**: OpenAI-compatible function schemas with detailed parameter definitions
- **Runtime Validation**: Zod-based parameter validation with sanitization
- **Execution Engine**: Secure function execution with authentication and rate limiting
- **Context Management**: User context preservation across function calls

### Available Functions

**Core Booking Functions:**
- `searchFlights`: Intelligent flight search with flexible parameter handling
- `createBooking`: Complete booking creation with automatic user profile integration
- `getUserBookings`: Retrieve user's booking history with filtering options
- `getBookingDetails`: Detailed booking information for specific reservations
- `getUserInfo`: Access to user profile and account information

**Function Capabilities:**
- **Smart Parameter Extraction**: Automatically extract booking details from conversation context
- **User Profile Integration**: Auto-fill passenger and contact information from authenticated user data
- **Validation & Sanitization**: Comprehensive input validation with helpful error messages
- **Authentication Integration**: Seamless user authentication checking with context preservation

### Conversation Flow Design

**Natural Language Understanding:**
- Context-aware parameter extraction from conversational input
- Support for partial information with intelligent follow-up questions
- Flexible date handling (relative dates like "next available" or specific dates)
- Multi-turn conversations with state preservation

**Response Generation:**
- Structured responses with clear formatting and actionable information
- Error handling with helpful suggestions and alternative options
- Confirmation flows for critical operations like booking creation
- Rich text responses with flight details, pricing, and next steps

---

## Database Design & Data Flow

### Database Schema

**Users Table:**
- Primary user information with authentication credentials
- Profile data for auto-filling booking forms
- Created/updated timestamps for audit trails
- Unique email constraints for account management

**Bookings Table:**
- Complete booking records with enriched flight information
- JSON storage for complex nested data (flight details, passenger info)
- Status tracking for booking lifecycle management
- Foreign key relationships with user accounts

**Payment Methods Table:**
- Secure storage of payment method metadata
- Masked card information for user convenience
- User-specific payment method associations
- Support for multiple payment methods per user

### Data Flow Architecture

**API Layer:**
- RESTful API endpoints for all major operations
- Consistent response formatting with error handling
- Authentication middleware for protected routes
- Input validation and sanitization at API boundaries

**Service Layer:**
- Database abstraction with transaction support
- Business logic separation from API controllers
- Data transformation and enrichment services
- Migration system for schema evolution

**Client State Management:**
- React Context for authentication state
- Local state management for UI components
- API integration with proper error handling
- Real-time data updates for booking status

---

## User Experience & Interface

### Design Philosophy
- **Accessibility First**: Built on Radix UI primitives for comprehensive accessibility support
- **Mobile-Responsive**: Fully responsive design optimized for all device sizes
- **Modern Aesthetics**: Clean, professional design with subtle animations and transitions
- **Intuitive Navigation**: Clear information hierarchy with logical user flows

### Key Interface Components

**Flight Search Interface:**
- Prominent search form with intelligent input validation
- Auto-complete and suggestion features for destinations
- Date pickers with calendar integration
- Advanced filtering options for preferences

**Booking Flow:**
- Step-by-step booking process with clear progress indicators
- Passenger information forms with smart defaults
- Payment integration with secure processing
- Confirmation screens with detailed booking summaries

**Dashboard Interface:**
- Comprehensive overview cards with key metrics
- Interactive booking lists with filtering and sorting
- Travel insights with visual analytics
- Quick action buttons for common tasks

**AI Assistant Widget:**
- Floating chat interface accessible from any page
- Voice control buttons with visual feedback
- Message history with conversation persistence
- Seamless integration with booking functions

### Responsive Design
- Mobile-first approach with progressive enhancement
- Touch-friendly interface elements on mobile devices
- Optimized layouts for tablet and desktop viewing
- Consistent experience across all device types

---

## API Architecture & Endpoints

### API Design Principles
- RESTful design with consistent URL patterns
- Standardized response formats with proper HTTP status codes
- Comprehensive error handling with descriptive messages
- Input validation and sanitization at all endpoints

### Core API Endpoints

**Authentication Endpoints:**
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User authentication with session management
- `GET /api/users/[id]` - User profile retrieval
- `PUT /api/users/[id]` - User profile updates

**Flight & Booking Endpoints:**
- `GET /api/flights/search` - Flight search with query parameters
- `POST /api/bookings` - Create new booking with validation
- `GET /api/bookings` - Retrieve user bookings with filtering
- `GET /api/bookings/[id]` - Specific booking details
- `PUT /api/bookings/[id]` - Booking modifications

**AI Assistant Endpoints:**
- `POST /api/chat` - AI conversation handling with function calling
- `POST /api/tts` - Text-to-speech generation
- `GET /api/config` - Assistant configuration and capabilities

**Payment Endpoints:**
- `GET /api/users/[id]/payment-methods` - Retrieve saved payment methods
- `POST /api/payments` - Process payment transactions
- `PUT /api/users/[id]/payment-methods` - Manage payment methods

### Function Calling Integration
- Seamless integration between chat API and booking functions
- Automatic user context propagation to function calls
- Real-time function execution with streaming responses
- Comprehensive error handling and user feedback

---

## Security & Authentication

### Authentication Strategy
- **Context-Based Authentication**: React Context API for client-side state management
- **Session Management**: Secure session handling with proper token management
- **Route Protection**: Middleware-based route protection for authenticated endpoints
- **User Data Security**: Encrypted password storage with secure validation

### Data Security
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Proper output sanitization and CSP headers
- **CSRF Protection**: Token-based CSRF protection for state-changing operations

### API Security
- **Rate Limiting**: Function-specific rate limiting for AI assistant calls
- **Request Validation**: Schema-based validation for all API endpoints
- **Error Handling**: Secure error messages without information leakage
- **Authentication Middleware**: Consistent authentication checking across protected routes

### Privacy & Compliance
- **Data Minimization**: Collect only necessary user information
- **Secure Storage**: Proper encryption for sensitive data
- **User Control**: Clear privacy controls and data management options
- **Audit Trails**: Comprehensive logging for security monitoring

---

## Testing Strategy

### Testing Philosophy
- **Comprehensive Coverage**: Unit, integration, and end-to-end testing
- **AI Function Testing**: Specialized testing for AI assistant functions
- **Component Testing**: React component testing with user interaction simulation
- **API Testing**: Complete API endpoint testing with validation

### Testing Infrastructure

**Unit Testing:**
- Jest with React Testing Library for component testing
- Custom testing utilities for AI function validation
- Mock services for external API integrations
- Comprehensive assertion libraries for data validation

**Integration Testing:**
- Database integration testing with test database
- API endpoint testing with real request/response cycles
- AI assistant workflow testing with mock LLM responses
- Payment flow testing with payment provider mocks

**End-to-End Testing:**
- Complete user journey testing from search to booking
- AI assistant conversation flow testing
- Cross-browser compatibility testing
- Mobile responsiveness testing

### Test Coverage Areas
- **Function Validation**: AI assistant function parameter validation and execution
- **Booking Workflows**: Complete booking creation and management flows
- **Authentication**: User registration, login, and session management
- **Error Handling**: Comprehensive error scenario testing
- **Performance**: Load testing for AI assistant and booking operations

---

## Development Workflow & Deployment

### Development Environment
- **Local Development**: Next.js development server with hot reloading
- **Database**: Local SQLite database with migration support
- **AI Integration**: Configurable LLM and TTS providers for testing
- **Environment Configuration**: Comprehensive environment variable management

### Build & Deployment
- **Production Build**: Optimized Next.js build with static generation
- **Database Migration**: Automated database schema migration system
- **Environment Management**: Separate configurations for development, staging, and production
- **Performance Optimization**: Code splitting, image optimization, and caching strategies

### Code Quality & Standards
- **TypeScript**: Strict TypeScript configuration with comprehensive type checking
- **ESLint**: Code linting with React and TypeScript-specific rules
- **Prettier**: Consistent code formatting across the project
- **Git Hooks**: Pre-commit hooks for code quality enforcement

### Monitoring & Maintenance
- **Error Tracking**: Comprehensive error logging and monitoring
- **Performance Monitoring**: Application performance tracking and optimization
- **Database Monitoring**: Query performance and database health monitoring
- **AI Assistant Analytics**: Function call success rates and performance metrics

---

## Future Enhancements & Roadmap

### Planned Features
- **Advanced AI Capabilities**: Multi-language support and enhanced conversation abilities
- **Real Payment Integration**: Integration with major payment providers
- **Enhanced Analytics**: Advanced travel analytics and personalized recommendations
- **Mobile Applications**: Native mobile apps for iOS and Android
- **International Expansion**: Support for international airlines and currencies

### Technical Improvements
- **Performance Optimization**: Advanced caching and performance enhancements
- **Scalability**: Database optimization and horizontal scaling capabilities
- **Security Enhancements**: Advanced security features and compliance certifications
- **API Expansion**: Public API for third-party integrations

### Innovation Areas
- **Machine Learning**: Personalized recommendations and predictive analytics
- **Voice Recognition**: Enhanced voice interaction capabilities
- **Real-time Updates**: Live flight status and booking notifications
- **Integration Ecosystem**: Partnerships with airlines and travel services

---

## Conclusion

SkyBooker represents a significant advancement in travel booking technology, combining traditional web-based booking capabilities with cutting-edge AI assistant technology. The platform demonstrates how conversational AI can be meaningfully integrated into complex business workflows, providing users with a natural and efficient way to search for and book flights.

The technical architecture emphasizes modularity, scalability, and user experience, while the AI assistant system showcases the potential of function-calling LLMs in real-world applications. With its comprehensive feature set, robust testing infrastructure, and modern development practices, SkyBooker serves as both a functional travel booking platform and a demonstration of advanced AI integration in web applications.

The platform's success lies in its seamless integration of multiple technologies to create a cohesive user experience that feels both familiar and innovative, making flight booking accessible through natural conversation while maintaining the robustness and reliability expected from modern web applications.