"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MatchHistoryTable } from "@/components/match-history-table";
import { useClickSound } from "@/hooks/useClickSound";
import {
  ArrowLeft,
  BarChart3,
  History,
  Anchor,
  Loader2,
  Target,
  Crosshair,
} from "lucide-react";

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
            <Card className="card-relief p-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
                    <Crosshair className="h-6 w-6" />
                    Win/Loss Rate by Model
                    <Crosshair className="h-6 w-6" />
                  </h2>
                  <p className="text-cyan-500/70 text-sm uppercase tracking-wide">
                    Percentage of Matches Won vs Lost
                  </p>
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-green-600 to-green-400" />
                    <span className="text-xs text-cyan-300 uppercase">
                      Wins
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-red-600 to-red-400" />
                    <span className="text-xs text-cyan-300 uppercase">
                      Losses
                    </span>
                  </div>
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {[...rankings]
                      .sort((a, b) => b.winRate - a.winRate)
                      .map((model) => {
                        const lossRate = 100 - model.winRate;

                        return (
                          <div
                            key={model.modelName}
                            className="p-4 bg-black/50 border border-cyan-800/40 rounded-lg hover:border-cyan-600/60 transition-all"
                          >
                            {/* Model Name and Total Battles */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-cyan-300 uppercase tracking-wider text-sm">
                                  {model.modelName}
                                </h3>
                                <p className="text-[10px] text-cyan-600 uppercase">
                                  {model.totalBattles} Battles
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-green-400 font-bold">
                                  {model.wins}W
                                </span>
                                <span className="text-cyan-600 mx-1">/</span>
                                <span className="text-red-400 font-bold">
                                  {model.losses}L
                                </span>
                              </div>
                            </div>

                            {/* Grouped Bar Chart */}
                            <div className="space-y-2">
                              {/* Win Rate Bar */}
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-cyan-500 uppercase w-12">
                                  Win
                                </span>
                                <div className="flex-1 h-6 bg-black/60 rounded-md border border-cyan-800/40 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-sm transition-all duration-500 flex items-center justify-end pr-2"
                                    style={{
                                      width: `${Math.max(model.winRate, 2)}%`,
                                    }}
                                  >
                                    {model.winRate >= 15 && (
                                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                                        {model.winRate}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {model.winRate < 15 && (
                                  <span className="text-[10px] font-bold text-green-400 w-10">
                                    {model.winRate}%
                                  </span>
                                )}
                              </div>

                              {/* Loss Rate Bar */}
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-cyan-500 uppercase w-12">
                                  Loss
                                </span>
                                <div className="flex-1 h-6 bg-black/60 rounded-md border border-cyan-800/40 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-sm transition-all duration-500 flex items-center justify-end pr-2"
                                    style={{
                                      width: `${Math.max(lossRate, 2)}%`,
                                    }}
                                  >
                                    {lossRate >= 15 && (
                                      <span className="text-[10px] font-bold text-white drop-shadow-md">
                                        {lossRate}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {lossRate < 15 && (
                                  <span className="text-[10px] font-bold text-red-400 w-10">
                                    {lossRate}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {rankings.length === 0 && (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                        <p className="text-cyan-500/70 uppercase tracking-wide">
                          No battle data available yet
                        </p>
                        <p className="text-cyan-600/50 text-sm mt-2">
                          Start a battle to see rankings
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
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
