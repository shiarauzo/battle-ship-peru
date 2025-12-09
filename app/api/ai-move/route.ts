// app/api/ai-move/route.ts
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";


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
  console.log("AI Move API called");
  
  try {
    const body: RequestBody = await req.json();
    const { model, previousShots, gridSize } = body;

    console.log("Request:", { model, shotsCount: previousShots.length });

    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error(" AI_GATEWAY_API_KEY not configured");
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Calcular celdas disponibles
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
      console.error(" No available cells");
      return NextResponse.json(
        { error: "No available cells" },
        { status: 400 }
      );
    }

    const recentHits = previousShots
      .filter(s => s.hit)
      .slice(-5)
      .map(s => {
        const col = String.fromCharCode(65 + s.col);
        return `${col}${s.row + 1}`;
      });

    const recentShots = previousShots.slice(-10);
    const shotHistory = recentShots
      .map((shot, idx) => {
        const colLetter = String.fromCharCode(65 + shot.col);
        const globalIdx = previousShots.length - recentShots.length + idx + 1;
        return `${globalIdx}. ${colLetter}${shot.row + 1}: ${shot.hit ? "HIT ✓" : "MISS ✗"}`;
      })
      .join("\n");

    const prompt = `You're playing Battleship on an 8x8 grid (rows 0-7, cols 0-7).

RECENT SHOTS (last 10):
${shotHistory || "No shots yet"}

${recentHits.length > 0 ? `RECENT HITS: ${recentHits.join(", ")}
IMPORTANT: Shoot ADJACENT cells (up/down/left/right) to find the rest of the ship!` : ""}

STRATEGY:
${previousShots.filter(s => s.hit).length > 0 
  ? "- You have hits! Target cells directly adjacent (not diagonal) to recent hits"
  : "- Use a systematic pattern like checkerboard or diagonal sweep"}
- Never repeat coordinates you've already shot
- Total shots taken: ${previousShots.length}

CRITICAL: Respond with ONLY valid JSON in this exact format:
{"row": <number 0-7>, "col": <number 0-7>}

No explanations. No markdown. Just the JSON object.`;

    console.log(" Calling AI model:", model);

    // ✅ CORRECTO: Usar el endpoint de Vercel AI Gateway
    const response = await fetch("https://api.vercel.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model, 
        messages: [
          {
            role: "system",
            content: "You are a strategic Battleship AI player. Always respond with valid JSON containing row (0-7) and col (0-7) coordinates."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error [${response.status}]:`, errorText);
      
      
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      return NextResponse.json({
        row: randomCell.row,
        col: randomCell.col,
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
        console.log(" Parsed move:", move);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Raw response:", text);
      
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      console.log("Using fallback:", randomCell);
      
      return NextResponse.json({
        row: randomCell.row,
        col: randomCell.col,
        fallback: true,
      });
    }

    // Validar move
    if (
      typeof move.row !== "number" ||
      typeof move.col !== "number" ||
      move.row < 0 ||
      move.row >= gridSize ||
      move.col < 0 ||
      move.col >= gridSize
    ) {
      console.warn(" Invalid coordinates from AI:", move);
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      return NextResponse.json({
        row: randomCell.row,
        col: randomCell.col,
        fallback: true,
      });
    }

    if (shotCells.has(`${move.row},${move.col}`)) {
      console.warn("AI chose already-shot cell:", move);
      const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      return NextResponse.json({
        row: randomCell.row,
        col: randomCell.col,
        fallback: true,
      });
    }

    console.log("Valid move:", move);
    return NextResponse.json({ 
      row: move.row, 
      col: move.col,
      model 
    });

  } catch (error) {
    console.error("Error in ai-move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}