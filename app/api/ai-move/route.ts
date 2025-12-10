// app/api/ai-move/route.ts
import { NextResponse } from "next/server";

interface Shot {
  row: number;
  col: number;
  hit: boolean;
}

interface RequestBody {
  model: string;
  previousShots: Shot[];
  gridSize: number;
}

interface StrategyData {
  winRate: number;
  totalGames: number;
  strategies: {
    hunt: { effectiveness: number; totalUses: number };
    target: { effectiveness: number; totalUses: number };
  };
  successfulOpenings: { row: number; col: number; hit: boolean }[];
  successfulFollowUps: { row: number; col: number; hit: boolean; previousHits: { row: number; col: number }[] }[];
}

// Analyze patterns in current game for in-game learning
function analyzeGamePatterns(shots: Shot[]): {
  hitClusters: { row: number; col: number }[][];
  potentialShipDirections: { center: { row: number; col: number }; direction: "horizontal" | "vertical" | "unknown" }[];
  huntingZones: { row: number; col: number }[];
} {
  const hits = shots.filter(s => s.hit);
  const hitSet = new Set(hits.map(h => `${h.row},${h.col}`));
  const shotSet = new Set(shots.map(s => `${s.row},${s.col}`));

  // Find clusters of hits (likely same ship)
  const visited = new Set<string>();
  const clusters: { row: number; col: number }[][] = [];

  for (const hit of hits) {
    const key = `${hit.row},${hit.col}`;
    if (visited.has(key)) continue;

    const cluster: { row: number; col: number }[] = [];
    const queue = [{ row: hit.row, col: hit.col }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = `${current.row},${current.col}`;
      if (visited.has(currentKey)) continue;
      if (!hitSet.has(currentKey)) continue;

      visited.add(currentKey);
      cluster.push(current);

      // Check adjacent cells
      const adjacent = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ];

      for (const adj of adjacent) {
        if (hitSet.has(`${adj.row},${adj.col}`)) {
          queue.push(adj);
        }
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  // Determine ship directions from clusters
  const potentialShipDirections = clusters
    .filter(c => c.length >= 2)
    .map(cluster => {
      const rows = [...new Set(cluster.map(c => c.row))];
      const cols = [...new Set(cluster.map(c => c.col))];
      const direction: "horizontal" | "vertical" | "unknown" =
        rows.length === 1 ? "horizontal" :
        cols.length === 1 ? "vertical" : "unknown";
      return {
        center: cluster[0],
        direction,
      };
    });

  // Find hunting zones (areas near hits that haven't been explored)
  const huntingZones: { row: number; col: number }[] = [];
  for (const hit of hits) {
    const adjacent = [
      { row: hit.row - 1, col: hit.col },
      { row: hit.row + 1, col: hit.col },
      { row: hit.row, col: hit.col - 1 },
      { row: hit.row, col: hit.col + 1 },
    ];
    for (const adj of adjacent) {
      if (adj.row >= 0 && adj.row < 8 && adj.col >= 0 && adj.col < 8) {
        if (!shotSet.has(`${adj.row},${adj.col}`)) {
          huntingZones.push(adj);
        }
      }
    }
  }

  return { hitClusters: clusters, potentialShipDirections, huntingZones };
}

// Fetch historical strategy data for cross-game learning
async function fetchStrategyData(model: string, baseUrl: string): Promise<StrategyData | null> {
  try {
    const response = await fetch(`${baseUrl}/api/get-strategies?model=${encodeURIComponent(model)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log("Could not fetch strategy data:", error);
  }
  return null;
}

export async function POST(req: Request) {
  console.log("AI Move API called");

  try {
    const body: RequestBody = await req.json();
    const { model, previousShots, gridSize } = body;

    console.log("Request:", { model, shotsCount: previousShots.length });

    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error("AI_GATEWAY_API_KEY not configured");
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Calculate available cells
    const shotCells = new Set(
      previousShots.map((shot) => `${shot.row},${shot.col}`)
    );

    const availableCells: { row: number; col: number }[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (!shotCells.has(`${row},${col}`)) {
          availableCells.push({ row, col });
        }
      }
    }

    if (availableCells.length === 0) {
      console.error("No available cells");
      return NextResponse.json(
        { error: "No available cells" },
        { status: 400 }
      );
    }

    // IN-GAME LEARNING: Analyze current game patterns
    const gameAnalysis = analyzeGamePatterns(previousShots);
    const { hitClusters, potentialShipDirections, huntingZones } = gameAnalysis;

    // CROSS-GAME LEARNING: Fetch historical strategy data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const strategyData = await fetchStrategyData(model, baseUrl);

    // Build enhanced shot history
    const recentShots = previousShots.slice(-15);
    const shotHistory = recentShots
      .map((shot, idx) => {
        const colLetter = String.fromCharCode(65 + shot.col);
        const globalIdx = previousShots.length - recentShots.length + idx + 1;
        return `${globalIdx}. ${colLetter}${shot.row + 1}: ${shot.hit ? "HIT" : "MISS"}`;
      })
      .join("\n");

    // Build priority targets based on in-game analysis
    const priorityTargets = huntingZones
      .filter(z => availableCells.some(c => c.row === z.row && c.col === z.col))
      .slice(0, 8)
      .map(z => `${String.fromCharCode(65 + z.col)}${z.row + 1}`)
      .join(", ");

    // Build ship direction hints
    const directionHints = potentialShipDirections
      .map(d => {
        const col = String.fromCharCode(65 + d.center.col);
        return `Ship at ${col}${d.center.row + 1} is likely ${d.direction}`;
      })
      .join("\n");

    // Build cross-game learning insights
    let learningInsights = "";
    if (strategyData && strategyData.totalGames > 0) {
      learningInsights = `
LEARNING FROM ${strategyData.totalGames} PREVIOUS GAMES (Win rate: ${(strategyData.winRate * 100).toFixed(1)}%):
- Hunt mode effectiveness: ${(strategyData.strategies.hunt.effectiveness * 100).toFixed(1)}%
- Target mode effectiveness: ${(strategyData.strategies.target.effectiveness * 100).toFixed(1)}%`;

      if (strategyData.successfulOpenings.length > 0 && previousShots.length < 5) {
        const goodOpenings = strategyData.successfulOpenings
          .filter(o => !shotCells.has(`${o.row},${o.col}`))
          .slice(0, 3)
          .map(o => `${String.fromCharCode(65 + o.col)}${o.row + 1}`)
          .join(", ");
        if (goodOpenings) {
          learningInsights += `\n- Historically successful opening moves: ${goodOpenings}`;
        }
      }
    }

    // Build the enhanced prompt
    const prompt = `You're playing Battleship on an 8x8 grid (rows 0-7, cols 0-7).
Ships: 5 cells, 4 cells, 3 cells, 3 cells, 2 cells (total 17 hits to win).

GAME STATE:
- Total shots: ${previousShots.length}
- Total hits: ${previousShots.filter(s => s.hit).length}
- Ships likely remaining: ${Math.max(0, 5 - hitClusters.filter(c => c.length >= 2).length)}

SHOT HISTORY (last 15):
${shotHistory || "No shots yet"}

${hitClusters.length > 0 ? `
CURRENT ANALYSIS (IN-GAME LEARNING):
- Active hit clusters: ${hitClusters.length}
- Cluster sizes: ${hitClusters.map(c => c.length).join(", ")} hits each
${directionHints ? `- Ship directions detected:\n${directionHints}` : ""}
${priorityTargets ? `- HIGH PRIORITY TARGETS (adjacent to hits): ${priorityTargets}` : ""}
` : ""}
${learningInsights}

STRATEGY RULES:
1. ${huntingZones.length > 0
  ? `TARGET MODE: You have unsunk ships! Fire at cells adjacent to hits: ${priorityTargets || "check near recent hits"}`
  : "HUNT MODE: Use checkerboard pattern (row+col is even) for efficient coverage"}
2. ${potentialShipDirections.length > 0
  ? `Continue along detected ship directions (${potentialShipDirections.map(d => d.direction).join(", ")})`
  : "When you get a hit, try all 4 adjacent cells to find ship orientation"}
3. Never repeat a coordinate you've already shot
4. Prefer center-area cells over edges for hunting

RESPOND WITH ONLY THIS JSON FORMAT:
{"row": <0-7>, "col": <0-7>}

No explanation. No markdown. Just the JSON.`;

    console.log("Calling AI model:", model);

    const response = await fetch("https://api.vercel.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an expert Battleship AI with ${strategyData?.totalGames || 0} games of experience. You learn from each game and apply winning strategies. Always respond with valid JSON containing row (0-7) and col (0-7) coordinates. ${strategyData && strategyData.winRate > 0.5 ? "Your current strategies are working well - maintain your approach." : "Focus on improving hit accuracy by targeting adjacent cells after hits."}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.6, // Lower temperature for more strategic consistency
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error [${response.status}]:`, errorText);

      // Smart fallback: prefer hunting zones if available
      const fallbackCell = huntingZones.length > 0
        ? huntingZones.find(z => availableCells.some(c => c.row === z.row && c.col === z.col)) ||
          availableCells[Math.floor(Math.random() * availableCells.length)]
        : availableCells[Math.floor(Math.random() * availableCells.length)];

      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
        error: `API error: ${response.status}`,
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    console.log("AI Response:", text);

    let move: { row: number; col: number };
    try {
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        move = JSON.parse(jsonMatch[0]);
        console.log("Parsed move:", move);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Raw response:", text);

      // Smart fallback
      const fallbackCell = huntingZones.length > 0
        ? huntingZones.find(z => availableCells.some(c => c.row === z.row && c.col === z.col)) ||
          availableCells[Math.floor(Math.random() * availableCells.length)]
        : availableCells[Math.floor(Math.random() * availableCells.length)];

      console.log("Using fallback:", fallbackCell);

      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
      });
    }

    // Validate move
    if (
      typeof move.row !== "number" ||
      typeof move.col !== "number" ||
      move.row < 0 ||
      move.row >= gridSize ||
      move.col < 0 ||
      move.col >= gridSize
    ) {
      console.warn("Invalid coordinates from AI:", move);
      const fallbackCell = huntingZones.length > 0
        ? huntingZones.find(z => availableCells.some(c => c.row === z.row && c.col === z.col)) ||
          availableCells[Math.floor(Math.random() * availableCells.length)]
        : availableCells[Math.floor(Math.random() * availableCells.length)];
      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
      });
    }

    if (shotCells.has(`${move.row},${move.col}`)) {
      console.warn("AI chose already-shot cell:", move);
      const fallbackCell = huntingZones.length > 0
        ? huntingZones.find(z => availableCells.some(c => c.row === z.row && c.col === z.col)) ||
          availableCells[Math.floor(Math.random() * availableCells.length)]
        : availableCells[Math.floor(Math.random() * availableCells.length)];
      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
      });
    }

    // Determine if this was a follow-up move (for learning)
    const wasFollowUp = huntingZones.some(z => z.row === move.row && z.col === move.col);

    console.log("Valid move:", move, wasFollowUp ? "(follow-up)" : "(hunt)");
    return NextResponse.json({
      row: move.row,
      col: move.col,
      model,
      wasFollowUp,
      previousHits: previousShots.filter(s => s.hit).slice(-5),
    });
  } catch (error) {
    console.error("Error in ai-move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
