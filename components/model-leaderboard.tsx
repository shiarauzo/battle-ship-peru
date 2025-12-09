"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface ModelLeaderboardProps {
  data: ModelStats[]
}

export function ModelLeaderboard({ data }: ModelLeaderboardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-600 text-black"
      case 2:
        return "bg-gray-400 text-black"
      case 3:
        return "bg-orange-600 text-black"
      default:
        return "bg-green-600 text-black"
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-400"
    if (accuracy >= 60) return "text-yellow-400"
    if (accuracy >= 40) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <Card className="monitor-frame p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-glow uppercase tracking-wider text-center">
          Model Performance Rankings
        </h2>
        
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {data.map((model, index) => (
              <Card key={model.modelName} className="p-4 bg-black/50 border-green-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={`font-bold ${getRankColor(index + 1)}`}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <h3 className="font-bold text-green-400 uppercase tracking-wider">
                        {model.modelName}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase">
                        {model.totalBattles} Battles
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className={`text-lg font-bold ${getAccuracyColor(model.averageAccuracy)}`}>
                      {model.averageAccuracy}% ACC
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {model.wins}W - {model.losses}L ({model.winRate}%)
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">Hit Rate</div>
                    <div className="font-bold text-green-400">{model.hitRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Total Hits</div>
                    <div className="font-bold text-green-400">{model.totalHits}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Total Misses</div>
                    <div className="font-bold text-red-400">{model.totalMisses}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}