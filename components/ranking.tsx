"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModelLeaderboard } from "@/components/model-leaderboard"
import { MatchHistoryTable } from "@/components/match-history-table"
import { useClickSound } from "@/hooks/useClickSound"

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

interface RankingProps {
  onBack: () => void
}

export function Ranking({ onBack }: RankingProps) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "history">("leaderboard")
  const [rankings, setRankings] = useState<ModelStats[]>([])
  const [battles, setBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)
  const { playClick } = useClickSound()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch rankings and battles in parallel
        const [rankingsResponse, battlesResponse] = await Promise.all([
          fetch("/api/rankings"),
          fetch("/api/battles?limit=50")
        ])

        if (rankingsResponse.ok) {
          const rankingsData = await rankingsResponse.json()
          setRankings(rankingsData.data || [])
        }

        if (battlesResponse.ok) {
          const battlesData = await battlesResponse.json()
          setBattles(battlesData.data || [])
        }
      } catch (error) {
        console.error("Error fetching ranking data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-glow text-2xl font-bold uppercase tracking-wider">
            Loading Battle Data...
          </div>
          <div className="text-muted-foreground uppercase tracking-wider">
            Retrieving AI Model Statistics
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-glow uppercase tracking-wider">
            Battle Rankings
          </h1>
          <p className="text-muted-foreground uppercase tracking-wider">
            AI Model Performance Analysis
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => {
              playClick()
              setActiveTab("leaderboard")
            }}
            variant={activeTab === "leaderboard" ? "default" : "outline"}
            className={`font-bold uppercase tracking-wider ${
              activeTab === "leaderboard"
                ? "bg-green-600 text-black"
                : "border-green-600 text-green-400 hover:bg-green-950"
            }`}
          >
            [ Model Rankings ]
          </Button>
          <Button
            onClick={() => {
              playClick()
              setActiveTab("history")
            }}
            variant={activeTab === "history" ? "default" : "outline"}
            className={`font-bold uppercase tracking-wider ${
              activeTab === "history"
                ? "bg-green-600 text-black"
                : "border-green-600 text-green-400 hover:bg-green-950"
            }`}
          >
            [ Match History ]
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "leaderboard" ? (
            <ModelLeaderboard data={rankings} />
          ) : (
            <MatchHistoryTable data={battles} />
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              playClick()
              onBack()
            }}
            variant="outline"
            className="font-bold uppercase tracking-wider border-green-600 text-green-400 hover:bg-green-950"
          >
            [ Back to Menu ]
          </Button>
        </div>
      </div>
    </div>
  )
}