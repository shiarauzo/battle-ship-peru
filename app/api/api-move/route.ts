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

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { model, previousShots, gridSize } = body;

    if (!process.env.VERCEL_AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: "VERCEL_AI_GATEWAY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Get available cells (not yet shot)
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

    // Build shot history description
    const shotHistory = previousShots
      .map((shot, idx) => {
        const colLetter = String.fromCharCode(65 + shot.col); // A-H
        return `Shot ${idx + 1}: ${colLetter}${shot.row + 1} - ${
          shot.hit ? "HIT" : "MISS"
        }`;
      })
      .join("\n");

    // Create prompt for the AI
    const prompt = `You are playing Battleship on a ${gridSize}x${gridSize} grid (rows 0-${gridSize - 1}, columns 0-${gridSize - 1}).

Game Rules:
- You must sink all enemy ships by hitting all their cells
- Ships are placed on the grid (you don't know their exact positions)
- You take turns firing at coordinates
- You cannot shoot the same cell twice

Your previous shots:
${shotHistory || "No shots taken yet"}

Available cells to shoot (not yet fired):
${availableCells.length > 0 ? availableCells.map(c => `Row ${c.row}, Col ${c.col} (${String.fromCharCode(65 + c.col)}${c.row + 1})`).slice(0, 20).join(", ") : "None"}

Strategy hints:
${previousShots.filter(s => s.hit).length > 0 
  ? "- You have hits! Consider targeting adjacent cells to find the full ship"
  : "- Start with a systematic search pattern"}
- Avoid shooting cells you've already tried
- Think strategically about ship placement patterns

Return your next move as a JSON object with this exact format:
{"row": <number 0-${gridSize - 1}>, "col": <number 0-${gridSize - 1}>}

Choose a cell from the available cells. Return ONLY the JSON, no other text.`;

    // Call Vercel AI Gateway API (OpenAI-compatible)
    // Vercel AI Gateway uses Cloudflare's gateway endpoint
    const response = await fetch("https://gateway.ai.cloudflare.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VERCEL_AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model, // Format: "openai/gpt-4.1-mini", "anthropic/claude-sonnet-4.5", etc.
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway API error:", response.status, errorText);
      throw new Error(`AI Gateway API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Parse JSON response
    let move: { row: number; col: number };
    try {
      // Try to extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        move = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // If parsing fails, fallback to random available cell
      console.error("Failed to parse AI response:", text, parseError);
      if (availableCells.length > 0) {
        const randomCell =
          availableCells[Math.floor(Math.random() * availableCells.length)];
        return NextResponse.json({
          row: randomCell.row,
          col: randomCell.col,
          fallback: true,
        });
      }
      throw new Error("Failed to parse AI response and no available cells");
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
      // Invalid coordinates, use random available cell
      if (availableCells.length > 0) {
        const randomCell =
          availableCells[Math.floor(Math.random() * availableCells.length)];
        return NextResponse.json({
          row: randomCell.row,
          col: randomCell.col,
          fallback: true,
        });
      }
      return NextResponse.json(
        { error: "Invalid coordinates from AI" },
        { status: 400 }
      );
    }

    // Check if cell was already shot
    if (shotCells.has(`${move.row},${move.col}`)) {
      // Cell already shot, use random available cell
      if (availableCells.length > 0) {
        const randomCell =
          availableCells[Math.floor(Math.random() * availableCells.length)];
        return NextResponse.json({
          row: randomCell.row,
          col: randomCell.col,
          fallback: true,
        });
      }
      return NextResponse.json(
        { error: "AI chose already-shot cell and no alternatives" },
        { status: 400 }
      );
    }

    return NextResponse.json({ row: move.row, col: move.col });
  } catch (error) {
    console.error("Error in api-move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

