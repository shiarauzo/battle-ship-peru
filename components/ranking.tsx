"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModelLeaderboard } from "@/components/model-leaderboard";
import { MatchHistoryTable } from "@/components/match-history-table";
import { useClickSound } from "@/hooks/useClickSound";
import { ArrowLeft, BarChart3, History, Anchor, Loader2 } from "lucide-react";

interface ModelStats {
  modelName: string;
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;
  averageAccuracy: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
}

interface Battle {
  id: number;
  modelA: string;
  modelB: string;
  accuracyA: number;
  accuracyB: number;
  hitsA: number;
  hitsB: number;
  missesA: number;
  missesB: number;
  winner: string;
}

interface RankingProps {
  onBack: () => void;
}

export function Ranking({ onBack }: RankingProps) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "history">(
    "leaderboard",
  );
  const [rankings, setRankings] = useState<ModelStats[]>([]);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const { playClick } = useClickSound();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [rankingsResponse, battlesResponse] = await Promise.all([
          fetch("/api/rankings"),
          fetch("/api/battles?limit=50"),
        ]);

        if (rankingsResponse.ok) {
          const rankingsData = await rankingsResponse.json();
          setRankings(rankingsData.data || []);
        }

        if (battlesResponse.ok) {
          const battlesData = await battlesResponse.json();
          setBattles(battlesData.data || []);
        }
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 hex-pattern">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto" />
          <div className="text-glow text-2xl font-bold uppercase tracking-wider">
            Loading Battle Data...
          </div>
          <div className="text-cyan-500/70 uppercase tracking-wider text-sm">
            Retrieving AI Model Statistics
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 hex-pattern">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
            <Anchor className="h-8 w-8" />
            Battle Rankings
            <Anchor className="h-8 w-8" />
          </h1>
          <p className="text-cyan-500/70 uppercase tracking-wider">
            AI Model Performance Analysis
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => {
              playClick();
              setActiveTab("leaderboard");
            }}
            variant={activeTab === "leaderboard" ? "default" : "outline"}
            className={`font-bold uppercase tracking-wider px-6 ${
              activeTab === "leaderboard"
                ? "bg-cyan-700 text-white border-cyan-500 hover:bg-cyan-600"
                : "border-cyan-600 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300"
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />[ Model Rankings ]
          </Button>
          <Button
            onClick={() => {
              playClick();
              setActiveTab("history");
            }}
            variant={activeTab === "history" ? "default" : "outline"}
            className={`font-bold uppercase tracking-wider px-6 ${
              activeTab === "history"
                ? "bg-cyan-700 text-white border-cyan-500 hover:bg-cyan-600"
                : "border-cyan-600 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300"
            }`}
          >
            <History className="h-4 w-4 mr-2" />[ Match History ]
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
              playClick();
              onBack();
            }}
            variant="outline"
            className="font-bold uppercase tracking-wider border-cyan-600 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300 px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />[ Back to Menu ]
          </Button>
        </div>
      </div>
    </div>
  );
}
