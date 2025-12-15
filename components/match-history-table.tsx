"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Swords, Target, Crosshair } from "lucide-react";

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

interface MatchHistoryTableProps {
  data: Battle[];
}

export function MatchHistoryTable({ data }: MatchHistoryTableProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-400";
    if (accuracy >= 60) return "text-cyan-400";
    if (accuracy >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getAccuracyBarColor = (accuracy: number) => {
    if (accuracy >= 80) return "from-green-600 to-green-400";
    if (accuracy >= 60) return "from-cyan-600 to-cyan-400";
    if (accuracy >= 40) return "from-yellow-600 to-yellow-400";
    return "from-red-600 to-red-400";
  };

  return (
    <Card className="card-relief p-6">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-glow uppercase tracking-wider flex items-center justify-center gap-3">
            <Swords className="h-6 w-6" />
            Match History
            <Swords className="h-6 w-6" />
          </h2>
          <p className="text-cyan-500/70 text-sm uppercase tracking-wide">
            Recent Battle Records
          </p>
        </div>

        <ScrollArea className="h-[550px]">
          <div className="space-y-3 pr-4">
            {data.map((battle) => (
              <Card
                key={battle.id}
                className="p-4 bg-black/50 border-cyan-800/40 hover:border-cyan-600/60 transition-all"
              >
                {/* Battle Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-cyan-700 text-cyan-400"
                    >
                      Battle #{battle.id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <Badge className="bg-cyan-700 text-white text-xs uppercase">
                      Winner
                    </Badge>
                    <span className="font-bold text-glow uppercase tracking-wider text-sm">
                      {battle.winner}
                    </span>
                  </div>
                </div>

                {/* VS Display */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                  {/* Model A */}
                  <div
                    className={`space-y-3 p-3 rounded-lg ${battle.winner === battle.modelA ? "bg-cyan-900/30 border border-cyan-600/40" : "bg-black/30 border border-cyan-900/30"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${battle.winner === battle.modelA ? "bg-yellow-400" : "bg-cyan-600"}`}
                      />
                      <span
                        className={`font-bold uppercase text-sm ${battle.winner === battle.modelA ? "text-cyan-300" : "text-cyan-500"}`}
                      >
                        {battle.modelA}
                      </span>
                      {battle.winner === battle.modelA && (
                        <Trophy className="h-3 w-3 text-yellow-400" />
                      )}
                    </div>

                    {/* Accuracy Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cyan-500/70 uppercase">
                          Accuracy
                        </span>
                        <span
                          className={`font-bold ${getAccuracyColor(battle.accuracyA)}`}
                        >
                          {battle.accuracyA}%
                        </span>
                      </div>
                      <div className="h-4 bg-black/60 rounded border border-cyan-800/40 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getAccuracyBarColor(battle.accuracyA)} rounded-sm`}
                          style={{ width: `${battle.accuracyA}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-cyan-600">Hits:</span>
                        <span className="font-bold text-green-400">
                          {battle.hitsA}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-600">Misses:</span>
                        <span className="font-bold text-red-400">
                          {battle.missesA}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex flex-col items-center gap-1">
                    <Crosshair className="h-5 w-5 text-cyan-600" />
                    <span className="text-cyan-500 font-bold text-sm">VS</span>
                    <Target className="h-5 w-5 text-cyan-600" />
                  </div>

                  {/* Model B */}
                  <div
                    className={`space-y-3 p-3 rounded-lg ${battle.winner === battle.modelB ? "bg-cyan-900/30 border border-cyan-600/40" : "bg-black/30 border border-cyan-900/30"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${battle.winner === battle.modelB ? "bg-yellow-400" : "bg-blue-500"}`}
                      />
                      <span
                        className={`font-bold uppercase text-sm ${battle.winner === battle.modelB ? "text-cyan-300" : "text-cyan-500"}`}
                      >
                        {battle.modelB}
                      </span>
                      {battle.winner === battle.modelB && (
                        <Trophy className="h-3 w-3 text-yellow-400" />
                      )}
                    </div>

                    {/* Accuracy Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cyan-500/70 uppercase">
                          Accuracy
                        </span>
                        <span
                          className={`font-bold ${getAccuracyColor(battle.accuracyB)}`}
                        >
                          {battle.accuracyB}%
                        </span>
                      </div>
                      <div className="h-4 bg-black/60 rounded border border-cyan-800/40 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getAccuracyBarColor(battle.accuracyB)} rounded-sm`}
                          style={{ width: `${battle.accuracyB}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-cyan-600">Hits:</span>
                        <span className="font-bold text-green-400">
                          {battle.hitsB}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-600">Misses:</span>
                        <span className="font-bold text-red-400">
                          {battle.missesB}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {data.length === 0 && (
              <div className="text-center py-12">
                <Swords className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                <p className="text-cyan-500/70 uppercase tracking-wide">
                  No battles recorded yet
                </p>
                <p className="text-cyan-600/50 text-sm mt-2">
                  Complete a battle to see match history
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
