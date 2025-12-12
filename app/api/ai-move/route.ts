// app/api/ai-move/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { modelQValues, modelHyperparameters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateProbabilityMap,
  estimateRemainingShips,
  type ProbabilityMap,
} from "@/lib/probability-engine";
import {
  determineState,
  serializeState,
  selectAction,
  getTargetCellsForAction,
  loadQTableFromDB,
  getHyperparameters,
  type QValueEntry,
} from "@/lib/q-learning";

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
  successfulFollowUps: {
    row: number;
    col: number;
    hit: boolean;
    previousHits: { row: number; col: number }[];
  }[];
}

// Fetch Q-values for model from database
async function fetchQValues(model: string): Promise<QValueEntry[]> {
  try {
    const qValues = await db
      .select()
      .from(modelQValues)
      .where(eq(modelQValues.model, model));

    return qValues.map((qv) => ({
      model: qv.model,
      state: qv.state,
      action: qv.action,
      qValue: qv.qValue || 0,
      visitCount: qv.visitCount || 0,
      learningRate: qv.learningRate || 0.1,
      discountFactor: qv.discountFactor || 0.9,
    }));
  } catch (error) {
    console.log("Could not fetch Q-values:", error);
    return [];
  }
}

// Fetch model hyperparameters
async function fetchHyperparameters(model: string) {
  try {
    const result = await db
      .select()
      .from(modelHyperparameters)
      .where(eq(modelHyperparameters.model, model))
      .limit(1);

    if (result.length > 0) {
      return {
        learningRate: result[0].learningRate || 0.1,
        discountFactor: result[0].discountFactor || 0.9,
        explorationRate: result[0].explorationRate || 0.15,
      };
    }
  } catch (error) {
    console.log("Could not fetch hyperparameters:", error);
  }
  return getHyperparameters();
}

// Fetch historical strategy data for cross-game learning
async function fetchStrategyData(
  model: string,
  baseUrl: string,
): Promise<StrategyData | null> {
  try {
    const response = await fetch(
      `${baseUrl}/api/get-strategies?model=${encodeURIComponent(model)}`,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log("Could not fetch strategy data:", error);
  }
  return null;
}

// Analyze patterns in current game for in-game learning
function analyzeGamePatterns(shots: Shot[]): {
  hitClusters: { row: number; col: number }[][];
  potentialShipDirections: {
    center: { row: number; col: number };
    direction: "horizontal" | "vertical" | "unknown";
  }[];
  huntingZones: { row: number; col: number }[];
} {
  const hits = shots.filter((s) => s.hit);
  const hitSet = new Set(hits.map((h) => `${h.row},${h.col}`));
  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));

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
    .filter((c) => c.length >= 2)
    .map((cluster) => {
      const rows = [...new Set(cluster.map((c) => c.row))];
      const cols = [...new Set(cluster.map((c) => c.col))];
      const direction: "horizontal" | "vertical" | "unknown" =
        rows.length === 1
          ? "horizontal"
          : cols.length === 1
            ? "vertical"
            : "unknown";
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
        { status: 500 },
      );
    }

    // Calculate available cells
    const shotCells = new Set(
      previousShots.map((shot) => `${shot.row},${shot.col}`),
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
        { status: 400 },
      );
    }

    // ============================================
    // PROBABILISTIC AI: Generate Bayesian heatmap
    // ============================================
    const remainingShips = estimateRemainingShips(previousShots);
    const probabilityMap: ProbabilityMap = generateProbabilityMap(
      previousShots,
      remainingShips,
    );

    console.log(
      "Probability map generated, top cells:",
      probabilityMap.topCells.slice(0, 5),
    );

    // ============================================
    // Q-LEARNING: Get state and select action
    // ============================================
    const qValueEntries = await fetchQValues(model);
    const qTable = loadQTableFromDB(qValueEntries);
    const hyperparameters = await fetchHyperparameters(model);

    const currentState = determineState(previousShots);
    const stateKey = serializeState(currentState);
    const selectedAction = selectAction(
      currentState,
      qTable,
      hyperparameters.explorationRate,
    );

    console.log("Q-Learning state:", stateKey, "Action:", selectedAction);

    // Get target cells based on Q-Learning action
    const qLearningTargets = getTargetCellsForAction(
      selectedAction,
      previousShots,
      probabilityMap.topCells,
    );

    // ============================================
    // COMBINE: 60% probability + 40% Q-Learning
    // ============================================
    const combinedScores: {
      row: number;
      col: number;
      score: number;
      source: string;
    }[] = [];

    // Add probability-based cells
    for (const cell of probabilityMap.topCells.slice(0, 10)) {
      combinedScores.push({
        row: cell.row,
        col: cell.col,
        score: cell.probability * 0.6,
        source: "probability",
      });
    }

    // Add Q-Learning targets with bonus
    for (const cell of qLearningTargets) {
      const existing = combinedScores.find(
        (c) => c.row === cell.row && c.col === cell.col,
      );
      if (existing) {
        existing.score += 0.4;
        existing.source = "combined";
      } else {
        combinedScores.push({
          row: cell.row,
          col: cell.col,
          score: 0.4,
          source: "q-learning",
        });
      }
    }

    // Sort by combined score
    combinedScores.sort((a, b) => b.score - a.score);

    const topRecommendations = combinedScores.slice(0, 5);
    console.log("Top recommendations:", topRecommendations);

    // IN-GAME LEARNING: Analyze current game patterns
    const gameAnalysis = analyzeGamePatterns(previousShots);
    const { hitClusters, potentialShipDirections, huntingZones } = gameAnalysis;

    // CROSS-GAME LEARNING: Fetch historical strategy data
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const strategyData = await fetchStrategyData(model, baseUrl);

    // Build enhanced shot history
    const recentShots = previousShots.slice(-10);
    const shotHistory = recentShots
      .map((shot, idx) => {
        const colLetter = String.fromCharCode(65 + shot.col);
        const globalIdx = previousShots.length - recentShots.length + idx + 1;
        return `${globalIdx}. ${colLetter}${shot.row + 1}: ${shot.hit ? "HIT" : "MISS"}`;
      })
      .join("\n");

    // Build AI-recommended targets with scores
    const aiRecommendations = topRecommendations
      .map((r, idx) => {
        const colLetter = String.fromCharCode(65 + r.col);
        return `${idx + 1}. ${colLetter}${r.row + 1} (score: ${(r.score * 100).toFixed(0)}%, ${r.source})`;
      })
      .join("\n");

    // Build cross-game learning insights
    let learningInsights = "";
    if (strategyData && strategyData.totalGames > 0) {
      learningInsights = `
LEARNING FROM ${strategyData.totalGames} PREVIOUS GAMES (Win rate: ${(strategyData.winRate * 100).toFixed(1)}%):
- Hunt mode effectiveness: ${(strategyData.strategies.hunt.effectiveness * 100).toFixed(1)}%
- Target mode effectiveness: ${(strategyData.strategies.target.effectiveness * 100).toFixed(1)}%`;
    }

    // Build the enhanced prompt with probabilistic recommendations
    const prompt = `You're playing Battleship on an 8x8 grid (rows 0-7, cols 0-7).
Ships: 5 cells, 4 cells, 3 cells, 3 cells, 2 cells (total 17 hits to win).

GAME STATE:
- Total shots: ${previousShots.length}
- Total hits: ${previousShots.filter((s) => s.hit).length}
- Ships likely remaining: ${remainingShips.length} (sizes: ${remainingShips.join(", ")})
- Current mode: ${currentState.mode}

SHOT HISTORY (last 10):
${shotHistory || "No shots yet"}

AI PROBABILITY ANALYSIS (Bayesian + Q-Learning):
${aiRecommendations}

${
  hitClusters.length > 0
    ? `
DETECTED SHIP PATTERNS:
- Active hit clusters: ${hitClusters.length}
- Cluster sizes: ${hitClusters.map((c) => c.length).join(", ")} hits each
${potentialShipDirections.length > 0 ? `- Ship directions: ${potentialShipDirections.map((d) => d.direction).join(", ")}` : ""}
`
    : ""
}
${learningInsights}

STRATEGY (${currentState.mode}):
${
  currentState.mode.startsWith("hunt")
    ? "HUNT MODE: Choose from high-probability cells. Prefer checkerboard pattern."
    : "TARGET MODE: Focus on cells adjacent to hits. Follow ship direction if detected."
}

CHOOSE from the top recommendations above. Respond with ONLY JSON:
{"row": <0-7>, "col": <0-7|}

No explanation. Just JSON.`;

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
            content: `You are an expert Battleship AI using probabilistic targeting and reinforcement learning. You have ${strategyData?.totalGames || 0} games of experience. Choose from the AI-recommended cells for optimal play. Always respond with valid JSON containing row (0-7) and col (0-7).`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.4, // Lower temperature for more strategic consistency
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error [${response.status}]:`, errorText);

      // Smart fallback: use top recommendation from our analysis
      const fallbackCell = topRecommendations[0] || availableCells[0];

      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
        error: `API error: ${response.status}`,
        heatmap: probabilityMap.grid,
        state: stateKey,
        action: selectedAction,
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

      // Smart fallback using probabilistic analysis
      const fallbackCell = topRecommendations[0] || availableCells[0];

      console.log("Using fallback:", fallbackCell);

      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
        heatmap: probabilityMap.grid,
        state: stateKey,
        action: selectedAction,
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
      const fallbackCell = topRecommendations[0] || availableCells[0];
      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
        heatmap: probabilityMap.grid,
        state: stateKey,
        action: selectedAction,
      });
    }

    if (shotCells.has(`${move.row},${move.col}`)) {
      console.warn("AI chose already-shot cell:", move);
      const fallbackCell = topRecommendations[0] || availableCells[0];
      return NextResponse.json({
        row: fallbackCell.row,
        col: fallbackCell.col,
        fallback: true,
        heatmap: probabilityMap.grid,
        state: stateKey,
        action: selectedAction,
      });
    }

    // Determine if this was a follow-up move (for learning)
    const wasFollowUp = huntingZones.some(
      (z) => z.row === move.row && z.col === move.col,
    );

    console.log("Valid move:", move, wasFollowUp ? "(follow-up)" : "(hunt)");

    return NextResponse.json({
      row: move.row,
      col: move.col,
      model,
      wasFollowUp,
      previousHits: previousShots.filter((s) => s.hit).slice(-5),
      // Include heatmap for UI visualization
      heatmap: probabilityMap.grid,
      // Include Q-Learning info for tracking
      state: stateKey,
      action: selectedAction,
    });
  } catch (error) {
    console.error("Error in ai-move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
