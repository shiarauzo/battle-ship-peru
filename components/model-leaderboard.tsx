"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, Crosshair } from "lucide-react";

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

interface ModelLeaderboardProps {
  data: ModelStats[];
}

export function ModelLeaderboard({ data }: ModelLeaderboardProps) {
  // Sort by win rate descending
  const sortedData = [...data].sort((a, b) => b.winRate - a.winRate);

  return (
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
            <span className="text-xs text-cyan-300 uppercase">Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-red-600 to-red-400" />
            <span className="text-xs text-cyan-300 uppercase">Losses</span>
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-4 pr-4">
            {sortedData.map((model) => {
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
                          style={{ width: `${Math.max(model.winRate, 2)}%` }}
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
                          style={{ width: `${Math.max(lossRate, 2)}%` }}
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

            {data.length === 0 && (
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
  );
}
