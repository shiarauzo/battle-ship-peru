"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Battle {
  id: number
  modelA: string
  modelB: string
  accuracyA: number
  accuracyB: number
  hitsA: number
  hitsB: number
  missesA: number
  missesB: number
  winner: string
}

interface MatchHistoryTableProps {
  data: Battle[]
}

export function MatchHistoryTable({ data }: MatchHistoryTableProps) {
  const getWinnerColor = (winner: string, modelA: string, modelB: string) => {
    if (winner === modelA) return "text-green-400"
    if (winner === modelB) return "text-blue-400"
    return "text-muted-foreground"
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
          Match History
        </h2>
        
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {data.map((battle) => (
              <Card key={battle.id} className="p-4 bg-black/50 border-green-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Battle #{battle.id}
                    </Badge>
                    <Badge className="bg-green-600 text-black text-xs">
                      WINNER
                    </Badge>
                    <span className={`font-bold uppercase tracking-wider ${getWinnerColor(battle.winner, battle.modelA, battle.modelB)}`}>
                      {battle.winner}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Model A */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="font-bold text-green-400 uppercase text-sm">
                        {battle.modelA}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className={`font-bold ${getAccuracyColor(battle.accuracyA)}`}>
                          {battle.accuracyA}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hits:</span>
                        <span className="font-bold text-green-400">{battle.hitsA}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Misses:</span>
                        <span className="font-bold text-red-400">{battle.missesA}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Model B */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="font-bold text-blue-400 uppercase text-sm">
                        {battle.modelB}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className={`font-bold ${getAccuracyColor(battle.accuracyB)}`}>
                          {battle.accuracyB}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hits:</span>
                        <span className="font-bold text-green-400">{battle.hitsB}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Misses:</span>
                        <span className="font-bold text-red-400">{battle.missesB}</span>
                      </div>
                    </div>
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