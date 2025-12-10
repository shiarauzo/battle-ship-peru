import { db } from "@/db"
import { battles } from "@/db/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModelStats {
  modelName: string
  totalBattles: number
  wins: number
  losses: number
  winRate: number
  avgAccuracy: number
}

async function getModelStats(): Promise<ModelStats[]> {
  const allBattles = await db.select().from(battles)
  
  const modelMap = new Map<string, {
    battles: number
    wins: number
    losses: number
    totalAccuracy: number
  }>()

  allBattles.forEach(battle => {
    // Process Model A
    const modelA = battle.modelA
    if (!modelMap.has(modelA)) {
      modelMap.set(modelA, { battles: 0, wins: 0, losses: 0, totalAccuracy: 0 })
    }
    const statsA = modelMap.get(modelA)!
    statsA.battles++
    statsA.totalAccuracy += battle.accuracyA
    if (battle.winner === modelA) {
      statsA.wins++
    } else {
      statsA.losses++
    }

    // Process Model B
    const modelB = battle.modelB
    if (!modelMap.has(modelB)) {
      modelMap.set(modelB, { battles: 0, wins: 0, losses: 0, totalAccuracy: 0 })
    }
    const statsB = modelMap.get(modelB)!
    statsB.battles++
    statsB.totalAccuracy += battle.accuracyB
    if (battle.winner === modelB) {
      statsB.wins++
    } else {
      statsB.losses++
    }
  })

  return Array.from(modelMap.entries()).map(([modelName, stats]) => ({
    modelName,
    totalBattles: stats.battles,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.battles > 0 ? (stats.wins / stats.battles) * 100 : 0,
    avgAccuracy: stats.battles > 0 ? stats.totalAccuracy / stats.battles : 0
  })).sort((a, b) => b.winRate - a.winRate)
}

async function getMatchHistory() {
  return await db.select().from(battles).orderBy(battles.id)
}

export default async function RankingPage() {
  const modelStats = await getModelStats()
  const matchHistory = await getMatchHistory()

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Model Rankings</h1>
        <p className="text-muted-foreground">
          Statistics and performance metrics for all AI models
        </p>
      </div>

      {/* Model Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modelStats.map((stats) => (
          <Card key={stats.modelName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{stats.modelName}</CardTitle>
              <CardDescription>
                {stats.totalBattles} battles played
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <Badge variant={stats.winRate >= 60 ? "default" : stats.winRate >= 40 ? "secondary" : "destructive"}>
                  {stats.winRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Accuracy</span>
                <span className="font-medium">{stats.avgAccuracy.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">W: {stats.wins}</span>
                <span className="text-red-600">L: {stats.losses}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Match History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
          <CardDescription>
            Detailed results of all battles played
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Model A</th>
                    <th className="text-left p-2">Model B</th>
                    <th className="text-left p-2">Winner</th>
                    <th className="text-center p-2">A Fails</th>
                    <th className="text-center p-2">B Fails</th>
                    <th className="text-center p-2">A Accuracy</th>
                    <th className="text-center p-2">B Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {matchHistory.map((match) => (
                    <tr key={match.id} className="border-b">
                      <td className="p-2 font-medium">{match.modelA}</td>
                      <td className="p-2 font-medium">{match.modelB}</td>
                      <td className="p-2">
                        <Badge variant={match.winner === match.modelA ? "default" : "secondary"}>
                          {match.winner}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">{match.missesA}</td>
                      <td className="p-2 text-center">{match.missesB}</td>
                      <td className="p-2 text-center">{match.accuracyA}%</td>
                      <td className="p-2 text-center">{match.accuracyB}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matchHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No battles played yet. Start a game to see statistics!
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}