import { NextResponse } from "next/server";
import { db } from "@/db";
import { battles, battleMoves, modelStrategies } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface MoveData {
  model: string;
  moveNumber: number;
  row: number;
  col: number;
  hit: boolean;
  wasFollowUp: boolean;
  previousHits: { row: number; col: number }[];
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Insert battle and get the ID
    const result = await db.insert(battles).values({
      modelA: data.modelA,
      modelB: data.modelB,
      accuracyA: data.accuracyA,
      accuracyB: data.accuracyB,
      hitsA: data.hitsA,
      hitsB: data.hitsB,
      missesA: data.missesA,
      missesB: data.missesB,
      winner: data.winner,
    }).returning({ id: battles.id });

    const battleId = result[0]?.id;

    // If moves data is provided, save all moves for learning
    if (data.moves && Array.isArray(data.moves) && battleId) {
      for (const move of data.moves as MoveData[]) {
        // Save move
        await db.insert(battleMoves).values({
          battleId,
          model: move.model,
          moveNumber: move.moveNumber,
          row: move.row,
          col: move.col,
          hit: move.hit,
          previousHits: move.previousHits || [],
          wasFollowUp: move.wasFollowUp || false,
        });

        // Update model strategy effectiveness
        const patternType = move.wasFollowUp ? "target" : "hunt";

        const existing = await db
          .select()
          .from(modelStrategies)
          .where(
            and(
              eq(modelStrategies.model, move.model),
              eq(modelStrategies.patternType, patternType)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          const strategy = existing[0];
          const newSuccessCount = (strategy.successCount || 0) + (move.hit ? 1 : 0);
          const newTotalUses = (strategy.totalUses || 0) + 1;
          const newEffectiveness = newSuccessCount / newTotalUses;

          await db
            .update(modelStrategies)
            .set({
              successCount: newSuccessCount,
              totalUses: newTotalUses,
              effectiveness: newEffectiveness,
              updatedAt: new Date(),
            })
            .where(eq(modelStrategies.id, strategy.id));
        } else {
          await db.insert(modelStrategies).values({
            model: move.model,
            patternType,
            pattern: {
              description: patternType === "target"
                ? "Following up on previous hits"
                : "Hunting for new ships",
              successRate: move.hit ? 1 : 0,
              sampleMoves: [{ row: move.row, col: move.col, hit: move.hit }],
            },
            successCount: move.hit ? 1 : 0,
            totalUses: 1,
            effectiveness: move.hit ? 1 : 0,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, battleId });
  } catch (error) {
    console.error("Error saving battle:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
