import { NextResponse } from "next/server"
import { db } from "@/db"
import { battles } from "@/db/schema"


interface ModelStats {
  modelName: string
  totalBattles: number
  wins: number
  losses: number
  winRate: number
  averageAccuracy: number
  totalHits: number
  totalMisses: number
  hitRate: number
}

export async function GET() {
  try {
    // Get all battles to calculate statistics
    const allBattles = await db.select().from(battles)

    // Get all unique models
    const modelNames = new Set<string>()
    allBattles.forEach(battle => {
      modelNames.add(battle.modelA)
      modelNames.add(battle.modelB)
    })

    const modelStats: ModelStats[] = []

    // Calculate statistics for each model
    for (const modelName of modelNames) {
      const modelBattles = allBattles.filter(
        battle => battle.modelA === modelName || battle.modelB === modelName
      )

      const wins = modelBattles.filter(battle => battle.winner === modelName).length
      const totalBattles = modelBattles.length
      const losses = totalBattles - wins

      // Calculate accuracy and hit/miss totals
      let totalAccuracy = 0
      let totalHits = 0
      let totalMisses = 0

      modelBattles.forEach(battle => {
        if (battle.modelA === modelName) {
          totalAccuracy += battle.accuracyA
          totalHits += battle.hitsA
          totalMisses += battle.missesA
        } else {
          totalAccuracy += battle.accuracyB
          totalHits += battle.hitsB
          totalMisses += battle.missesB
        }
      })

      const averageAccuracy = totalBattles > 0 ? Math.round(totalAccuracy / totalBattles) : 0
      const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0
      const hitRate = (totalHits + totalMisses) > 0 ? Math.round((totalHits / (totalHits + totalMisses)) * 100) : 0

      modelStats.push({
        modelName,
        totalBattles,
        wins,
        losses,
        winRate,
        averageAccuracy,
        totalHits,
        totalMisses,
        hitRate
      })
    }

    // Sort by average accuracy (descending), then by win rate
    modelStats.sort((a, b) => {
      if (b.averageAccuracy !== a.averageAccuracy) {
        return b.averageAccuracy - a.averageAccuracy
      }
      return b.winRate - a.winRate
    })

    return NextResponse.json({
      success: true,
      data: modelStats
    })
  } catch (error) {
    console.error("Error calculating rankings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to calculate rankings" },
      { status: 500 }
    )
  }
}