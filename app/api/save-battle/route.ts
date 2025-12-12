import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  battles,
  battleMoves,
  modelStrategies,
  modelQValues,
  modelHyperparameters,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  processBattleForLearning,
  getHyperparameters,
  type ModelHyperparameters,
} from "@/lib/q-learning";

interface MoveData {
  model: string;
  moveNumber: number;
  row: number;
  col: number;
  hit: boolean;
  wasFollowUp: boolean;
  previousHits: { row: number; col: number }[];
  state?: string;
  action?: string;
}

// Fetch model hyperparameters from DB or use defaults
async function getModelHyperparameters(
  model: string,
): Promise<ModelHyperparameters> {
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

// Update Q-values in database using TD-learning
async function updateQValuesInDB(
  model: string,
  qUpdates: Map<string, { qValue: number; visitCount: number }>,
  hyperparameters: ModelHyperparameters,
) {
  for (const [key, update] of qUpdates.entries()) {
    const parts = key.split(":");
    const action = parts.pop()!;
    const state = parts.join(":");

    try {
      // Check if entry exists
      const existing = await db
        .select()
        .from(modelQValues)
        .where(
          and(
            eq(modelQValues.model, model),
            eq(modelQValues.state, state),
            eq(modelQValues.action, action),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing entry with exponential moving average
        const oldQ = existing[0].qValue || 0;
        const oldVisits = existing[0].visitCount || 0;

        // Weighted average: give more weight to new learning
        const newQ = oldQ * 0.7 + update.qValue * 0.3;
        const newVisits = oldVisits + update.visitCount;

        await db
          .update(modelQValues)
          .set({
            qValue: newQ,
            visitCount: newVisits,
            learningRate: hyperparameters.learningRate,
            discountFactor: hyperparameters.discountFactor,
            updatedAt: new Date(),
          })
          .where(eq(modelQValues.id, existing[0].id));
      } else {
        // Insert new entry
        await db.insert(modelQValues).values({
          model,
          state,
          action,
          qValue: update.qValue,
          visitCount: update.visitCount,
          learningRate: hyperparameters.learningRate,
          discountFactor: hyperparameters.discountFactor,
        });
      }
    } catch (error) {
      console.error(`Error updating Q-value for ${key}:`, error);
    }
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Insert battle and get the ID
    const result = await db
      .insert(battles)
      .values({
        modelA: data.modelA,
        modelB: data.modelB,
        accuracyA: data.accuracyA,
        accuracyB: data.accuracyB,
        hitsA: data.hitsA,
        hitsB: data.hitsB,
        missesA: data.missesA,
        missesB: data.missesB,
        winner: data.winner,
      })
      .returning({ id: battles.id });

    const battleId = result[0]?.id;

    // If moves data is provided, save all moves for learning
    if (data.moves && Array.isArray(data.moves) && battleId) {
      // Group moves by model
      const movesByModel = new Map<string, MoveData[]>();

      for (const move of data.moves as MoveData[]) {
        // Save move to database
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

        // Update model strategy effectiveness (existing logic)
        const patternType = move.wasFollowUp ? "target" : "hunt";

        const existing = await db
          .select()
          .from(modelStrategies)
          .where(
            and(
              eq(modelStrategies.model, move.model),
              eq(modelStrategies.patternType, patternType),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          const strategy = existing[0];
          const newSuccessCount =
            (strategy.successCount || 0) + (move.hit ? 1 : 0);
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
              description:
                patternType === "target"
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

        // Group moves for Q-Learning update
        if (!movesByModel.has(move.model)) {
          movesByModel.set(move.model, []);
        }
        movesByModel.get(move.model)!.push(move);
      }

      // ============================================
      // Q-LEARNING: Update Q-values for each model
      // ============================================
      for (const [model, moves] of movesByModel.entries()) {
        const won = data.winner === model;
        const hyperparameters = await getModelHyperparameters(model);

        // Process battle moves for Q-Learning
        const qUpdates = processBattleForLearning(
          moves.map((m) => ({
            row: m.row,
            col: m.col,
            hit: m.hit,
            wasFollowUp: m.wasFollowUp,
          })),
          won,
          hyperparameters,
        );

        // Update Q-values in database
        await updateQValuesInDB(model, qUpdates, hyperparameters);

        console.log(
          `Q-Learning: Updated ${qUpdates.size} state-action pairs for ${model} (won: ${won})`,
        );
      }
    }

    return NextResponse.json({ ok: true, battleId });
  } catch (error) {
    console.error("Error saving battle:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
