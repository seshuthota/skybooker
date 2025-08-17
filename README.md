# SkyBooker - Flight Booking Platform

SkyBooker is a modern flight booking platform built with Next.js 15, React 19, and TypeScript. It features a comprehensive flight search and booking system with user authentication, profile management, and payment processing.

## Features

- **Flight Search**: Search for flights by origin, destination, dates, and passenger count
- **Booking Management**: Create, view, and manage flight bookings
- **User Authentication**: Secure user registration and login system
- **Profile Management**: Manage personal information and payment methods
- **Payment Processing**: Secure payment handling with saved payment methods
- **AI Assistant**: Intelligent travel assistant powered by LLMs (Maya)
- **Responsive Design**: Fully responsive UI that works on all devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: React Context API
- **Database**: SQLite with local file storage
- **Authentication**: Token-based authentication
- **AI Integration**: OpenAI, Anthropic, or Groq API integration
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd skybooker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

4. Initialize the database:
   ```bash
   npm run seed
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Database Migration

If you have existing data in localStorage that you want to migrate to the SQLite database:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application in your browser to populate localStorage with data

3. Run the migration script:
   ```bash
   npm run migrate
   ```

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Database Structure

SkyBooker now uses SQLite for data persistence instead of localStorage. The database includes the following tables:

- **users**: User accounts with authentication information
- **bookings**: Flight bookings with passenger and payment details
- **paymentMethods**: Saved payment methods for users

## AI Assistant (Maya)

SkyBooker features an AI-powered travel assistant named Maya. The assistant can:

- Search for flights based on user queries
- Retrieve booking information
- Provide travel recommendations
- Assist with account management

The assistant integrates with various LLM providers:
- OpenAI (GPT-3.5, GPT-4, GPT-4o)
- Anthropic (Claude series)
- Groq (Llama series)

Configure your preferred provider using environment variables.

## Project Structure

```
skybooker/
├── app/                 # Next.js app router pages
├── components/           # React components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and services
├── public/              # Static assets
├── scripts/             # Utility scripts
├── styles/              # Global styles
├── tests/               # Test files
├── .env.local          # Environment variables
├── next.config.mjs      # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Optional TTS Configuration
KOKORI_API_URL=http://localhost:8880
KOKORI_API_KEY=your_kokori_api_key_here
```

## Deployment

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Flight icons and imagery from Lucide React
- UI components based on shadcn/ui
- AI assistant powered by various LLM providers