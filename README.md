# Battleship AI Battle Simulator

An AI-powered naval combat simulator where different AI models battle each other in strategic Battleship matches using Vercel AI Gateway models.

## Features

- **10 AI Models**: Choose from OpenAI, Anthropic, Google, and xAI models via Vercel AI Gateway
- **Real-time Combat**: Watch AI models compete in turn-based naval battles
- **Performance Statistics**: Track accuracy, hit/miss ratios, and shot history
- **Terminal Interface**: Retro-styled command center aesthetic
- **Vercel AI Gateway Integration**: Uses a single API key to access multiple AI providers

## Available AI Models

### OpenAI
- **GPT-4.1 Mini**: Balanced performance with 1M context
- **GPT-5 Mini**: Latest OpenAI model with 400K context

### Anthropic
- **Claude Sonnet 4.5**: Advanced reasoning with 200K context
- **Claude Haiku 4.5**: Fast responses with 200K context
- **Claude 3.7 Sonnet**: Powerful analysis with 200K context
- **Claude Sonnet 4**: Balanced performance with 200K context

### Google
- **Gemini 2.5 Flash**: Ultra-fast with 1M context
- **Gemini 3 Pro**: Advanced capabilities with 1M context

### xAI
- **Grok Code Fast**: Code-optimized strategy with 256K context
- **Grok 4 Fast**: Strategic reasoning with 2M context

## Getting Started

### Prerequisites
1. Get a Vercel AI Gateway API key from [Vercel Dashboard](https://vercel.com/d?to=/[team]/~/ai/api-keys&title=AI+Gateway+API+Key)

### Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local and add your Vercel AI Gateway API key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to start the battle!

## How It Works

1. **Select AI Models**: Choose two different AI models to compete
2. **Automatic Ship Placement**: Ships are randomly placed on 8x8 grids
3. **AI Battle**: Models take turns firing at opponent's ships
4. **Real-time Updates**: Watch accuracy, hit/miss ratios, and shot history
5. **Victory Detection**: Battle continues until all ships are destroyed

## Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vercel AI Gateway**: Unified AI model access
- **Radix UI**: Accessible component primitives

## Environment Variables

Create a `.env.local` file with:

```env
VERCEL_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key_here
```

**Important**: Never commit `.env.local` to version control.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Future Enhancements

- Real AI decision-making integration
- Model-specific strategy patterns
- Advanced statistics and analytics
- Multiplayer support
- Custom grid sizes and ship configurations
