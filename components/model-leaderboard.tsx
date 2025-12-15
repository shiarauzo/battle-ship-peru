"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Target, Crosshair } from "lucide-react";

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
  const maxWinRate = Math.max(...data.map((m) => m.winRate), 1);
  const maxAccuracy = Math.max(...data.map((m) => m.averageAccuracy), 1);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Trophy className="h-5 w-5 text-slate-300" />;
      case 3:
        return <Trophy className="h-5 w-5 text-orange-400" />;
      default:
        return <Target className="h-4 w-4 text-cyan-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-black";
      case 2:
        return "bg-slate-400 text-black";
      case 3:
        return "bg-orange-500 text-black";
      default:
        return "bg-cyan-700 text-white";
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-400";
    if (accuracy >= 60) return "text-cyan-400";
    if (accuracy >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getBarGradient = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "from-green-600 to-green-400";
    if (percentage >= 60) return "from-cyan-600 to-cyan-400";
    if (percentage >= 40) return "from-yellow-600 to-yellow-400";
    return "from-red-600 to-red-400";
  };

  return (
    <Card className="card-relief p-6">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
            <Crosshair className="h-6 w-6" />
            Model Performance Rankings
            <Crosshair className="h-6 w-6" />
          </h2>
          <p className="text-cyan-500/70 text-sm uppercase tracking-wide">
            Win Rate & Accuracy Statistics
          </p>
        </div>

        <ScrollArea className="h-[550px]">
          <div className="space-y-4 pr-4">
            {data.map((model, index) => (
              <Card
                key={model.modelName}
                className="p-4 bg-black/50 border-cyan-800/40 hover:border-cyan-600/60 transition-all"
              >
                {/* Header with rank and name */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getRankIcon(index + 1)}
                    <Badge
                      className={`font-bold text-sm px-2 py-0.5 ${getRankColor(index + 1)}`}
                    >
                      #{index + 1}
                    </Badge>
                    <div>
                      <h3 className="font-bold text-cyan-300 uppercase tracking-wider text-sm">
                        {model.modelName}
                      </h3>
                      <p className="text-[10px] text-cyan-600 uppercase">
                        {model.totalBattles} Battles Completed
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${getAccuracyColor(model.averageAccuracy)}`}
                    >
                      {model.averageAccuracy}%
                    </div>
                    <div className="text-[9px] text-cyan-600 uppercase">
                      Avg Accuracy
                    </div>
                  </div>
                </div>

                {/* Win Rate Bar */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-400 uppercase font-semibold">
                      Win Rate
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {model.winRate}%
                    </span>
                  </div>
                  <div className="h-6 bg-black/60 rounded-md border border-cyan-800/40 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getBarGradient(model.winRate, 100)} rounded-sm transition-all duration-500`}
                      style={{ width: `${model.winRate}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Accuracy Bar */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-400 uppercase font-semibold">
                      Hit Rate
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {model.hitRate}%
                    </span>
                  </div>
                  <div className="h-6 bg-black/60 rounded-md border border-cyan-800/40 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getBarGradient(model.hitRate, 100)} rounded-sm transition-all duration-500`}
                      style={{ width: `${model.hitRate}%` }}
                    >
                      <div className="h-full w-full bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t border-cyan-800/30">
                  <div className="text-center p-2 bg-cyan-950/30 rounded">
                    <div className="text-cyan-500/70 uppercase text-[9px]">
                      Wins
                    </div>
                    <div className="font-bold text-green-400">{model.wins}</div>
                  </div>
                  <div className="text-center p-2 bg-cyan-950/30 rounded">
                    <div className="text-cyan-500/70 uppercase text-[9px]">
                      Losses
                    </div>
                    <div className="font-bold text-red-400">{model.losses}</div>
                  </div>
                  <div className="text-center p-2 bg-cyan-950/30 rounded">
                    <div className="text-cyan-500/70 uppercase text-[9px]">
                      Total Hits
                    </div>
                    <div className="font-bold text-cyan-300">
                      {model.totalHits}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-cyan-950/30 rounded">
                    <div className="text-cyan-500/70 uppercase text-[9px]">
                      Total Misses
                    </div>
                    <div className="font-bold text-slate-400">
                      {model.totalMisses}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

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
