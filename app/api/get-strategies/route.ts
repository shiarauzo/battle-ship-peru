import { NextResponse } from "next/server";
import { db } from "@/db";
import { modelStrategies, battleMoves, battles } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const model = searchParams.get("model");

    if (!model) {
      return NextResponse.json({ error: "Model required" }, { status: 400 });
    }

    // Get model's strategy effectiveness
    const strategies = await db
      .select()
      .from(modelStrategies)
      .where(eq(modelStrategies.model, model))
      .orderBy(desc(modelStrategies.effectiveness));

    // Get model's historical performance
    const wins = await db
      .select({ count: sql<number>`count(*)` })
      .from(battles)
      .where(eq(battles.winner, model));

    const totalGames = await db
      .select({ count: sql<number>`count(*)` })
      .from(battles)
      .where(
        sql`${battles.modelA} = ${model} OR ${battles.modelB} = ${model}`
      );

    // Get successful opening moves (first 5 moves that led to wins)
    const successfulOpenings = await db
      .select({
        row: battleMoves.row,
        col: battleMoves.col,
        hit: battleMoves.hit,
      })
      .from(battleMoves)
      .innerJoin(battles, eq(battleMoves.battleId, battles.id))
      .where(
        and(
          eq(battleMoves.model, model),
          eq(battles.winner, model),
          sql`${battleMoves.moveNumber} <= 5`
        )
      )
      .limit(20);

    // Get most successful follow-up patterns (moves after hits)
    const followUpSuccess = await db
      .select({
        row: battleMoves.row,
        col: battleMoves.col,
        hit: battleMoves.hit,
        previousHits: battleMoves.previousHits,
      })
      .from(battleMoves)
      .innerJoin(battles, eq(battleMoves.battleId, battles.id))
      .where(
        and(
          eq(battleMoves.model, model),
          eq(battleMoves.wasFollowUp, true),
          eq(battleMoves.hit, true),
          eq(battles.winner, model)
        )
      )
      .limit(30);

    // Calculate overall strategy insights
    const huntStrategy = strategies.find((s) => s.patternType === "hunt");
    const targetStrategy = strategies.find((s) => s.patternType === "target");

    return NextResponse.json({
      model,
      winRate: totalGames[0]?.count > 0
        ? (wins[0]?.count || 0) / totalGames[0].count
        : 0,
      totalGames: totalGames[0]?.count || 0,
      strategies: {
        hunt: {
          effectiveness: huntStrategy?.effectiveness || 0,
          totalUses: huntStrategy?.totalUses || 0,
        },
        target: {
          effectiveness: targetStrategy?.effectiveness || 0,
          totalUses: targetStrategy?.totalUses || 0,
        },
      },
      successfulOpenings: successfulOpenings.slice(0, 10),
      successfulFollowUps: followUpSuccess.slice(0, 15),
    });
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
