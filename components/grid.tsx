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
// 0.0-0.2  → Blue (low probability)
// 0.2-0.4  → Cyan
// 0.4-0.6  → Yellow
// 0.6-0.8  → Orange
// 0.8-1.0  → Red (high probability)
function getProbabilityColor(probability: number): string {
  if (probability <= 0.2) {
    // Blue: rgb(59, 130, 246)
    const intensity = probability / 0.2;
    return `rgba(59, 130, 246, ${0.3 + intensity * 0.3})`;
  } else if (probability <= 0.4) {
    // Cyan: rgb(6, 182, 212)
    const intensity = (probability - 0.2) / 0.2;
    return `rgba(6, 182, 212, ${0.4 + intensity * 0.2})`;
  } else if (probability <= 0.6) {
    // Yellow: rgb(234, 179, 8)
    const intensity = (probability - 0.4) / 0.2;
    return `rgba(234, 179, 8, ${0.5 + intensity * 0.2})`;
  } else if (probability <= 0.8) {
    // Orange: rgb(249, 115, 22)
    const intensity = (probability - 0.6) / 0.2;
    return `rgba(249, 115, 22, ${0.6 + intensity * 0.2})`;
  } else {
    // Red: rgb(239, 68, 68)
    const intensity = (probability - 0.8) / 0.2;
    return `rgba(239, 68, 68, ${0.7 + intensity * 0.3})`;
  }
}

// Get text color for probability display
function getProbabilityTextColor(probability: number): string {
  if (probability >= 0.6) {
    return "rgba(255, 255, 255, 0.9)";
  }
  return "rgba(255, 255, 255, 0.7)";
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
    <div className="inline-block">
      <div className="grid grid-cols-9 gap-0.5 mb-0.5">
        <div className="w-7 h-7" />
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-primary uppercase"
          >
            {col}
          </div>
        ))}
      </div>

      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-9 gap-0.5 mb-0.5">
          {/* Row header */}
          <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-primary">
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
                  "w-7 h-7 border transition-all duration-200 relative",
                  status === "empty" &&
                    !hasShip &&
                    !showProbability &&
                    "bg-card/30 border-primary/20",
                  status === "empty" &&
                    hasShip &&
                    showShips &&
                    "border-primary/40",
                  status === "hit" &&
                    "bg-hit border-hit animate-pulse shadow-[0_0_10px_rgba(255,100,0,0.5)]",
                  status === "miss" && "bg-miss border-miss/50 opacity-50",
                  ship?.sunk && "opacity-30",
                )}
                style={{
                  backgroundColor: showProbability
                    ? getProbabilityColor(probability)
                    : status === "empty" && hasShip && showShips
                      ? ship.color + "40"
                      : undefined,
                  borderColor: showProbability
                    ? probability > 0.5
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(255, 255, 255, 0.1)"
                    : status === "empty" && hasShip && showShips
                      ? ship.color
                      : undefined,
                  boxShadow:
                    showProbability && probability > 0.7
                      ? `0 0 8px ${getProbabilityColor(probability)}, inset 0 0 4px rgba(255,255,255,0.2)`
                      : status === "empty" && hasShip && showShips
                        ? `0 0 8px ${ship.color}60, inset 0 0 8px ${ship.color}30`
                        : undefined,
                }}
              >
                {/* Probability percentage */}
                {showProbability && probability > 0.1 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
                    style={{ color: getProbabilityTextColor(probability) }}
                  >
                    {Math.round(probability * 100)}
                  </div>
                )}

                {status === "hit" && (
                  <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-xs">
                    ×
                  </div>
                )}
                {status === "miss" && (
                  <div className="w-full h-full flex items-center justify-center text-foreground/50 text-xs">
                    ·
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
