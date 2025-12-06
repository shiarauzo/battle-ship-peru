"use client"

import { cn } from "@/lib/utils"

interface Ship {
  id: number
  cells: { row: number; col: number }[]
  sunk: boolean
  color: string
}

interface Shot {
  row: number
  col: number
  hit: boolean
}

interface GridProps {
  ships: Ship[]
  shots: Shot[]
  showShips?: boolean
}

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"]

export function Grid({ ships, shots, showShips = false }: GridProps) {
  const getCellStatus = (row: number, col: number) => {
    const shot = shots.find((s) => s.row === row && s.col === col)
    if (shot) {
      return shot.hit ? "hit" : "miss"
    }
    return "empty"
  }

  const getShipAtCell = (row: number, col: number) => {
    return ships.find((ship) => ship.cells.some((cell) => cell.row === row && cell.col === col))
  }

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
            const status = getCellStatus(rowIndex, colIndex)
            const ship = getShipAtCell(rowIndex, colIndex)
            const hasShip = !!ship

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "w-7 h-7 border transition-all duration-200 relative",
                  status === "empty" && !hasShip && "bg-card/30 border-primary/20",
                  status === "empty" && hasShip && showShips && "border-primary/40",
                  status === "hit" && "bg-hit border-hit animate-pulse shadow-[0_0_10px_rgba(255,100,0,0.5)]",
                  status === "miss" && "bg-miss border-miss/50 opacity-50",
                  ship?.sunk && "opacity-30",
                )}
                style={{
                  backgroundColor: status === "empty" && hasShip && showShips ? ship.color + "40" : undefined,
                  borderColor: status === "empty" && hasShip && showShips ? ship.color : undefined,
                  boxShadow:
                    status === "empty" && hasShip && showShips
                      ? `0 0 8px ${ship.color}60, inset 0 0 8px ${ship.color}30`
                      : undefined,
                }}
              >
                {status === "hit" && (
                  <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold text-xs">
                    ×
                  </div>
                )}
                {status === "miss" && (
                  <div className="w-full h-full flex items-center justify-center text-foreground/50 text-xs">·</div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
