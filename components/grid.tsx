"use client";

import { cn } from "@/lib/utils";

interface Ship {
  id: number;
  cells: { row: number; col: number }[];
  sunk: boolean;
  color: string;
}

interface Shot {
  row: number;
  col: number;
  hit: boolean;
}

interface GridProps {
  ships: Ship[];
  shots: Shot[];
  showShips?: boolean;
  heatmap?: number[][]; // 8x8 probability grid (0-1)
  showHeatmap?: boolean;
}

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Convert probability (0-1) to color
function getProbabilityColor(probability: number): string {
  if (probability <= 0.2) {
    const intensity = probability / 0.2;
    return `rgba(0, 100, 180, ${0.3 + intensity * 0.3})`;
  } else if (probability <= 0.4) {
    const intensity = (probability - 0.2) / 0.2;
    return `rgba(0, 150, 200, ${0.4 + intensity * 0.2})`;
  } else if (probability <= 0.6) {
    const intensity = (probability - 0.4) / 0.2;
    return `rgba(0, 200, 220, ${0.5 + intensity * 0.2})`;
  } else if (probability <= 0.8) {
    const intensity = (probability - 0.6) / 0.2;
    return `rgba(255, 150, 50, ${0.6 + intensity * 0.2})`;
  } else {
    const intensity = (probability - 0.8) / 0.2;
    return `rgba(255, 80, 80, ${0.7 + intensity * 0.3})`;
  }
}

function getProbabilityTextColor(probability: number): string {
  if (probability >= 0.6) {
    return "rgba(255, 255, 255, 0.95)";
  }
  return "rgba(200, 230, 255, 0.85)";
}

export function Grid({
  ships,
  shots,
  showShips = false,
  heatmap,
  showHeatmap = false,
}: GridProps) {
  const getCellStatus = (row: number, col: number) => {
    const shot = shots.find((s) => s.row === row && s.col === col);
    if (shot) {
      return shot.hit ? "hit" : "miss";
    }
    return "empty";
  };

  const getShipAtCell = (row: number, col: number) => {
    return ships.find((ship) =>
      ship.cells.some((cell) => cell.row === row && cell.col === col),
    );
  };

  const getProbability = (row: number, col: number): number => {
    if (!heatmap || !heatmap[row]) return 0;
    return heatmap[row][col] || 0;
  };

  return (
    <div className="perspective-container">
      <div className="grid-container">
        <div className="board-3d inline-block">
          {/* Column headers */}
          <div className="grid grid-cols-9 gap-0.5 mb-1">
            <div className="w-8 h-8" />
            {COLUMNS.map((col) => (
              <div
                key={col}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold uppercase"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 5px rgba(0, 200, 255, 0.5)",
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-9 gap-0.5 mb-0.5">
              {/* Row header */}
              <div
                className="w-8 h-8 flex items-center justify-center text-xs font-bold"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 5px rgba(0, 200, 255, 0.5)",
                }}
              >
                {rowIndex + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: 8 }).map((_, colIndex) => {
                const status = getCellStatus(rowIndex, colIndex);
                const ship = getShipAtCell(rowIndex, colIndex);
                const hasShip = !!ship;
                const probability = getProbability(rowIndex, colIndex);
                const showProbability =
                  showHeatmap && status === "empty" && probability > 0;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      "w-8 h-8 relative cell-3d transition-all duration-200",
                      status === "empty" &&
                        !hasShip &&
                        !showProbability &&
                        "grid-cell",
                      status === "empty" &&
                        hasShip &&
                        showShips &&
                        "ship-cell cell-elevated",
                      status === "hit" && "hit-marker cell-hit-3d",
                      status === "miss" && "miss-marker cell-miss-3d",
                      ship?.sunk && "opacity-40",
                    )}
                    style={{
                      backgroundColor: showProbability
                        ? getProbabilityColor(probability)
                        : undefined,
                      borderColor:
                        showProbability && probability > 0.5
                          ? "rgba(255, 200, 100, 0.5)"
                          : undefined,
                      boxShadow:
                        showProbability && probability > 0.7
                          ? `0 0 12px ${getProbabilityColor(probability)}, inset 0 0 6px rgba(255,255,255,0.2)`
                          : undefined,
                    }}
                  >
                    {/* Probability percentage */}
                    {showProbability && probability > 0.1 && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                        style={{ color: getProbabilityTextColor(probability) }}
                      >
                        {Math.round(probability * 100)}
                      </div>
                    )}

                    {/* Ship indicator when visible */}
                    {status === "empty" && hasShip && showShips && (
                      <div className="absolute inset-1 rounded-sm bg-gradient-to-br from-cyan-600/40 to-cyan-900/60 border border-cyan-400/30" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
