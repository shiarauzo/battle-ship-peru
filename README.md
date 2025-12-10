# Battleship AI Battle Simulator

An AI-powered naval combat simulator where different large language models compete against each other in strategic Battleship matches. The system features adaptive learning that improves AI performance over time by analyzing patterns from both current games and historical battles.

## What This Project Does

This application pits AI models against each other in the classic game of Battleship. Unlike simple random-firing implementations, this system uses sophisticated pattern recognition and learning mechanisms to make intelligent targeting decisions.

**Key Capabilities:**
- 15 AI models from different providers compete head-to-head
- Real-time pattern analysis during gameplay
- Persistent learning from historical battles stored in PostgreSQL
- Adaptive strategy based on win rates and effectiveness metrics

## AI Decision Logic

### How the AI Makes Targeting Decisions

The AI operates in two distinct modes:

#### 1. Hunt Mode (Searching for Ships)
When no recent hits exist, the AI uses exploration strategies:
- **Checkerboard Pattern**: Targets cells where `(row + col) % 2 === 0` for efficient coverage
- **Center Preference**: Prioritizes center-area cells over edges (ships more likely in middle)
- **Historical Openings**: Uses successful opening moves from past winning games

#### 2. Target Mode (Following Up on Hits)
When hits exist but ships aren't fully sunk:
- **Adjacent Cell Priority**: Immediately targets cells directly up/down/left/right of hits
- **Ship Direction Detection**: Analyzes hit clusters to determine if ship is horizontal or vertical
- **Continuation Along Axis**: Once direction is known, continues firing along that axis

### In-Game Learning (Pattern Analysis)

Each turn, the system analyzes the current game state:

```
┌─────────────────────────────────────────┐
│         PATTERN ANALYSIS                │
├─────────────────────────────────────────┤
│ 1. Hit Clustering                       │
│    - Groups adjacent hits together      │
│    - Identifies likely ship locations   │
│                                         │
│ 2. Ship Direction Detection             │
│    - 2+ hits in a row = horizontal      │
│    - 2+ hits in a column = vertical     │
│                                         │
│ 3. Hunting Zone Calculation             │
│    - Lists all unshot cells adjacent    │
│      to existing hits                   │
│    - These become priority targets      │
└─────────────────────────────────────────┘
```

### Cross-Game Learning (Persistent Strategy)

After each battle, the system stores:
- **Every move made** with context (was it a follow-up? what were recent hits?)
- **Strategy effectiveness** (hunt mode vs target mode success rates)
- **Winning patterns** (which opening moves led to victories)

This data is queried before each move to inform the AI:

```
LEARNING FROM 47 PREVIOUS GAMES (Win rate: 62.5%):
- Hunt mode effectiveness: 28.3%
- Target mode effectiveness: 71.2%
- Historically successful opening moves: D4, E5, C3
```

### The Prompt Engineering

The AI receives a structured prompt containing:

1. **Game State**: Total shots, hits, estimated remaining ships
2. **Shot History**: Last 15 moves with hit/miss results
3. **Current Analysis**: Hit clusters, ship directions, priority targets
4. **Learning Insights**: Historical win rate and strategy effectiveness
5. **Strategy Rules**: Mode-specific instructions based on current situation

Example prompt structure:
```
You're playing Battleship on an 8x8 grid (rows 0-7, cols 0-7).
Ships: 5 cells, 4 cells, 3 cells, 3 cells, 2 cells (total 17 hits to win).

GAME STATE:
- Total shots: 23
- Total hits: 8
- Ships likely remaining: 3

CURRENT ANALYSIS (IN-GAME LEARNING):
- Active hit clusters: 2
- Cluster sizes: 3, 2 hits each
- Ship directions detected:
  Ship at D4 is likely horizontal
- HIGH PRIORITY TARGETS: D6, D7, E4

LEARNING FROM 47 PREVIOUS GAMES (Win rate: 62.5%):
- Target mode effectiveness: 71.2%

STRATEGY RULES:
1. TARGET MODE: Fire at cells adjacent to hits: D6, D7, E4
2. Continue along detected ship directions (horizontal)
```

### Smart Fallback System

If the AI returns an invalid move (already shot, out of bounds, or API error), the system uses intelligent fallbacks:

1. **First Priority**: Pick from hunting zones (adjacent to hits)
2. **Second Priority**: Random available cell
3. **Never**: Repeat a coordinate already shot

## Available AI Models (15 Providers)

| Provider | Model | ID |
|----------|-------|-----|
| OpenAI | GPT-4o | `openai/gpt-4o` |
| Anthropic | Claude Sonnet 4 | `anthropic/claude-sonnet-4` |
| Google | Gemini 2.5 Pro | `google/gemini-2.5-pro` |
| xAI | Grok 3 | `xai/grok-3` |
| Meta | Llama 4 Maverick | `meta/llama-4-maverick` |
| DeepSeek | DeepSeek R1 | `deepseek/deepseek-r1` |
| Mistral | Mistral Large | `mistral/mistral-large` |
| Alibaba | Qwen 3 Max | `alibaba/qwen3-max` |
| Perplexity | Sonar Pro | `perplexity/sonar-pro` |
| Cohere | Command A | `cohere/command-a` |
| Amazon | Nova Pro | `amazon/nova-pro` |
| Moonshot | Kimi K2 | `moonshot/kimi-k2` |
| Zhipu | GLM 4.6 | `zhipu/glm-4.6` |
| MiniMax | MiniMax M2 | `minimax/minimax-m2` |
| Meituan | Longcat Flash | `meituan/longcat-flash-thinking` |

## Database Schema

### Tables

**battles** - Stores game results
```sql
- id, modelA, modelB
- accuracyA, accuracyB
- hitsA, hitsB, missesA, missesB
- winner, createdAt
```

**battle_moves** - Stores individual moves for learning
```sql
- id, battleId, model, moveNumber
- row, col, hit
- previousHits (JSON), wasFollowUp
- createdAt
```

**model_strategies** - Stores learned strategy effectiveness
```sql
- id, model, patternType (hunt/target)
- pattern (JSON), successCount, totalUses
- effectiveness (0-1 score)
- updatedAt
```

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** with terminal/retro theme
- **PostgreSQL** via Neon Serverless
- **Drizzle ORM** for database operations
- **Vercel AI Gateway** for unified AI model access

## Getting Started

### Prerequisites
1. [Vercel AI Gateway API Key](https://vercel.com/ai-gateway)
2. [Neon PostgreSQL Database](https://neon.tech)

### Setup

1. Clone and install:
```bash
git clone <repo-url>
cd battle-ship-peru
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
```

Add to `.env.local`:
```env
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
DATABASE_URL=your_neon_postgres_connection_string
```

3. Push database schema:
```bash
npx drizzle-kit push
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-move` | POST | Get next move from AI model |
| `/api/save-battle` | POST | Save battle results and moves |
| `/api/get-strategies` | GET | Fetch model's historical strategy data |

## How a Battle Works

```
┌─────────────────────────────────────────────────────────┐
│                    BATTLE FLOW                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User selects two AI models                          │
│                          ↓                              │
│  2. Ships randomly placed on 8x8 grids (5 ships each)   │
│                          ↓                              │
│  3. Models alternate turns:                             │
│     ┌──────────────────────────────────────┐            │
│     │ a. Fetch historical strategy data    │            │
│     │ b. Analyze current game patterns     │            │
│     │ c. Build enhanced prompt             │            │
│     │ d. Call AI via Vercel Gateway        │            │
│     │ e. Validate and execute move         │            │
│     │ f. Check for victory                 │            │
│     └──────────────────────────────────────┘            │
│                          ↓                              │
│  4. Game ends when all 17 ship cells are hit            │
│                          ↓                              │
│  5. Battle saved with all moves for future learning     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/battle-ship-peru)

Remember to add environment variables in Vercel dashboard:
- `AI_GATEWAY_API_KEY`
- `DATABASE_URL`
