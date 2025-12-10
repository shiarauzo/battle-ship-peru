import { NextResponse } from "next/server";
import { db } from "@/db";
import { battleMoves, modelStrategies } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface MoveData {
  battleId: number;
  model: string;
  moveNumber: number;
  row: number;
  col: number;
  hit: boolean;
  previousHits: { row: number; col: number }[];
  wasFollowUp: boolean;
}

export async function POST(req: Request) {
  try {
    const data: MoveData = await req.json();

    // Save the move
    await db.insert(battleMoves).values({
      battleId: data.battleId,
      model: data.model,
      moveNumber: data.moveNumber,
      row: data.row,
      col: data.col,
      hit: data.hit,
      previousHits: data.previousHits,
      wasFollowUp: data.wasFollowUp,
    });

    // Update model strategy effectiveness
    const patternType = data.wasFollowUp ? "target" : "hunt";

    // Try to find existing strategy record
    const existing = await db
      .select()
      .from(modelStrategies)
      .where(
        and(
          eq(modelStrategies.model, data.model),
          eq(modelStrategies.patternType, patternType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing strategy
      const strategy = existing[0];
      const newSuccessCount = (strategy.successCount || 0) + (data.hit ? 1 : 0);
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
      // Create new strategy record
      await db.insert(modelStrategies).values({
        model: data.model,
        patternType,
        pattern: {
          description: patternType === "target"
            ? "Following up on previous hits"
            : "Hunting for new ships",
          successRate: data.hit ? 1 : 0,
          sampleMoves: [{ row: data.row, col: data.col, hit: data.hit }],
        },
        successCount: data.hit ? 1 : 0,
        totalUses: 1,
        effectiveness: data.hit ? 1 : 0,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
