"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useClickSound } from "@/hooks/useClickSound";
import { ArrowLeft, Anchor, Loader2, Target, Crosshair } from "lucide-react";

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

export default function RankingPage() {
  const router = useRouter();
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

  const sortedRankings = [...rankings].sort((a, b) => b.winRate - a.winRate);
  const maxBattles = Math.max(...rankings.map((r) => r.totalBattles), 1);

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
            <Anchor className="h-8 w-8" />
            Battle Rankings
            <Anchor className="h-8 w-8" />
          </h1>
          <p className="text-cyan-500/70 uppercase tracking-wider">
            AI Model Performance Analysis
          </p>
        </div>

        {/* Vertical Bar Chart */}
        <Card className="card-relief p-6">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
                <Crosshair className="h-5 w-5" />
                Win/Loss Rate by Model
                <Crosshair className="h-5 w-5" />
              </h2>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-green-600 to-green-400" />
                <span className="text-xs text-cyan-300 uppercase">Win %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-red-600 to-red-400" />
                <span className="text-xs text-cyan-300 uppercase">Loss %</span>
              </div>
            </div>

            {/* Vertical Bar Chart Container */}
            {sortedRankings.length > 0 ? (
              <div className="overflow-x-auto">
                <div
                  className="flex items-end justify-center gap-2 min-w-fit px-4"
                  style={{ height: "280px" }}
                >
                  {sortedRankings.map((model) => {
                    const lossRate = 100 - model.winRate;
                    const barHeight = 200;

                    return (
                      <div
                        key={model.modelName}
                        className="flex flex-col items-center gap-2"
                      >
                        {/* Bars Container */}
                        <div
                          className="flex items-end gap-1"
                          style={{ height: `${barHeight}px` }}
                        >
                          {/* Win Bar */}
                          <div className="relative flex flex-col items-center">
                            <span className="text-[9px] text-green-400 font-bold mb-1">
                              {model.winRate}%
                            </span>
                            <div
                              className="w-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm transition-all duration-500 border border-green-500/50"
                              style={{
                                height: `${Math.max((model.winRate / 100) * barHeight, 4)}px`,
                              }}
                            />
                          </div>
                          {/* Loss Bar */}
                          <div className="relative flex flex-col items-center">
                            <span className="text-[9px] text-red-400 font-bold mb-1">
                              {lossRate}%
                            </span>
                            <div
                              className="w-6 bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm transition-all duration-500 border border-red-500/50"
                              style={{
                                height: `${Math.max((lossRate / 100) * barHeight, 4)}px`,
                              }}
                            />
                          </div>
                        </div>
                        {/* Model Name */}
                        <div className="text-center w-16">
                          <p
                            className="text-[8px] text-cyan-300 font-bold uppercase leading-tight truncate"
                            title={model.modelName}
                          >
                            {model.modelName.split("/").pop()}
                          </p>
                          <p className="text-[7px] text-cyan-600">
                            {model.wins}W/{model.losses}L
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                <p className="text-cyan-500/70 uppercase tracking-wide">
                  No battle data available yet
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Match History */}
        <Card className="card-relief p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-glow uppercase tracking-wider">
                Match History
              </h2>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {battles.length > 0 ? (
                  battles.map((battle) => (
                    <div
                      key={battle.id}
                      className="flex items-center justify-between p-3 bg-black/50 border border-cyan-800/40 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold uppercase text-xs ${
                            battle.winner === battle.modelA
                              ? "text-green-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {battle.modelA.split("/").pop()}
                        </span>
                        <span className="text-cyan-600 text-xs">vs</span>
                        <span
                          className={`font-bold uppercase text-xs ${
                            battle.winner === battle.modelB
                              ? "text-green-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {battle.modelB.split("/").pop()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] text-cyan-500">
                          <span className="text-cyan-300">
                            {battle.accuracyA}%
                          </span>
                          <span className="mx-1">/</span>
                          <span className="text-cyan-300">
                            {battle.accuracyB}%
                          </span>
                        </div>
                        <Badge className="text-[9px] px-2 py-0 bg-green-600/80 text-white border-green-500">
                          {battle.winner.split("/").pop()}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-cyan-500/70 uppercase tracking-wide text-sm">
                      No matches played yet
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button
            onClick={() => {
              playClick();
              router.push("/");
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
