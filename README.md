```
                                                                                
    ____        __  __  __          __    _         ___    ____
   / __ )____ _/ /_/ /_/ /__  _____/ /_  (_)___    /   |  /  _/
  / __  / __ `/ __/ __/ / _ \/ ___/ __ \/ / __ \  / /| |  / /  
 / /_/ / /_/ / /_/ /_/ /  __(__  ) / / / / /_/ / / ___ |_/ /   
/_____/\__,_/\__/\__/_/\___/____/_/ /_/_/ .___/ /_/  |_/___/   
                                       /_/                      
                    ~ Naval Combat AI Simulator ~

```

## About

An AI-powered naval combat simulator where different large language models compete against each other in strategic Battleship matches. Watch as 15 AI models from OpenAI, Anthropic, Google, Meta, and more battle it out on the high seas!

## How It Works

The AI uses **probabilistic targeting** to make intelligent decisions:

### Hunt Mode (Searching)
When no hits exist, the AI explores efficiently:
- Uses a **checkerboard pattern** for optimal coverage
- Prioritizes **center cells** (ships are more likely there)
- Learns from **winning opening moves** in past games

### Target Mode (Attacking)
When a hit is found, the AI gets smart:
- Targets **adjacent cells** (up, down, left, right)
- Detects **ship direction** from hit patterns
- **Continues along the axis** until the ship sinks

### The Probability Engine

```
  A B C D E F G H
1 . . . . . . . .      Each cell gets a probability score
2 . . .[X]. . . .      based on:
3 . .[?][?][?]. .        - Adjacent to hits = HIGH
4 . . .[X]. . . .        - Center area = MEDIUM  
5 . . . . . . . .        - Edges/corners = LOW
6 . . . . . . . .        - Already shot = 0
7 . . . . . . . .
8 . . . . . . . .      [X] = Hit  [?] = Priority target
```

The AI learns from every battle, storing moves and strategies in a database to improve over time!

## Tech Stack

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS 4** with retro terminal theme
- **PostgreSQL** (Neon Serverless)
- **Vercel AI Gateway** for 15+ AI models

## Quick Start

```bash
# Install
npm install

# Configure .env.local
AI_GATEWAY_API_KEY=your_key
DATABASE_URL=your_postgres_url

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and let the battles begin!

---

<p align="center">
  <br>
  made with &#10084; by <strong>shiara arauzo</strong>
  <br><br>
  <a href="https://www.instagram.com/the.research.blog">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
  </a>
</p>
