"use client"

import { useState, useEffect } from "react"
import { Grid } from "@/components/grid"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  player: 1 | 2
}

interface BattleFieldProps {
  aiModel1: string
  aiModel2: string
}

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"]

const generateShips = (): Ship[] => {
  const ships: Ship[] = []
  const shipSizes = [5, 4, 3, 3, 2]
  const colors = [
    "hsl(200, 70%, 60%)",
    "hsl(220, 70%, 60%)",
    "hsl(180, 70%, 60%)",
    "hsl(160, 70%, 60%)",
    "hsl(140, 70%, 60%)",
  ]
  const occupied = new Set<string>()

  for (let i = 0; i < shipSizes.length; i++) {
    const size = shipSizes[i]
    let placed = false
    let attempts = 0

    while (!placed && attempts < 100) {
      attempts++
      const horizontal = Math.random() > 0.5
      const row = Math.floor(Math.random() * 8)
      const col = Math.floor(Math.random() * 8)

      // Verificar si el barco cabe
      if (horizontal && col + size > 8) continue
      if (!horizontal && row + size > 8) continue

      // Check if cells are free
      const cells: { row: number; col: number }[] = []
      let canPlace = true

      for (let j = 0; j < size; j++) {
        const cellRow = horizontal ? row : row + j
        const cellCol = horizontal ? col + j : col
        const key = `${cellRow},${cellCol}`

        if (occupied.has(key)) {
          canPlace = false
          break
        }
        cells.push({ row: cellRow, col: cellCol })
      }

      if (canPlace) {
        cells.forEach((cell) => occupied.add(`${cell.row},${cell.col}`))
        ships.push({
          id: i,
          cells,
          sunk: false,
          color: colors[i],
        })
        placed = true
      }
    }
  }

  return ships
}

export function BattleField({ aiModel1, aiModel2 }: BattleFieldProps) {
  const [ships1] = useState<Ship[]>(generateShips())
  const [ships2] = useState<Ship[]>(generateShips())
  const [shots1, setShots1] = useState<Shot[]>([])
  const [shots2, setShots2] = useState<Shot[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<1 | 2 | null>(null)

  const updateSunkShips = (ships: Ship[], shots: Shot[]): Ship[] => {
    return ships.map((ship) => {
      const allCellsHit = ship.cells.every((cell) =>
        shots.some((shot) => shot.row === cell.row && shot.col === cell.col && shot.hit),
      )
      return { ...ship, sunk: allCellsHit }
    })
  }

  // Calcular accuracy
  const calculateAccuracy = (shots: Shot[]) => {
    if (shots.length === 0) return 0
    const hits = shots.filter((s) => s.hit).length
    return Math.round((hits / shots.length) * 100)
  }

  const getTotalShipCells = (ships: Ship[]) => {
    return ships.reduce((total, ship) => total + ship.cells.length, 0)
  }

  // IA hace un disparo
  useEffect(() => {
    if (gameOver) return

    const timer = setTimeout(() => {
      const targetShips = currentPlayer === 1 ? ships2 : ships1
      const currentShots = currentPlayer === 1 ? shots1 : shots2

      // IA inteligente: evita repetir disparos
      let row: number, col: number
      let attempts = 0
      do {
        row = Math.floor(Math.random() * 8)
        col = Math.floor(Math.random() * 8)
        attempts++
      } while (attempts < 100 && currentShots.some((s) => s.row === row && s.col === col))

      const hit = targetShips.some((ship) => ship.cells.some((cell) => cell.row === row && cell.col === col))

      const newShot: Shot = { row, col, hit, player: currentPlayer }

      if (currentPlayer === 1) {
        const newShots = [...shots1, newShot]
        setShots1(newShots)
        const totalCells = getTotalShipCells(ships2)
        const hits = newShots.filter((s) => s.hit).length
        if (hits === totalCells) {
          setGameOver(true)
          setWinner(1)
        }
      } else {
        const newShots = [...shots2, newShot]
        setShots2(newShots)
        const totalCells = getTotalShipCells(ships1)
        const hits = newShots.filter((s) => s.hit).length
        if (hits === totalCells) {
          setGameOver(true)
          setWinner(2)
        }
      }

      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    }, 300)

    return () => clearTimeout(timer)
  }, [currentPlayer, gameOver, ships1, ships2, shots1, shots2])

  const updatedShips1 = updateSunkShips(ships1, shots2)
  const updatedShips2 = updateSunkShips(ships2, shots1)

  const renderShotLog = (shots: Shot[], aiModel: string) => (
    <ScrollArea className="h-[150px] w-full rounded border border-primary/30 p-2 bg-card/50">
      <div className="space-y-1">
        {shots.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-2">WAITING...</p>
        ) : (
          shots.map((shot, index) => (
            <div key={index} className="flex items-center justify-between p-1.5 rounded bg-muted/30 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
                <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                  {COLUMNS[shot.col]}
                  {shot.row + 1}
                </Badge>
              </div>
              <Badge
                variant={shot.hit ? "default" : "secondary"}
                className={shot.hit ? "bg-hit text-[10px] px-1 py-0" : "bg-miss text-[10px] px-1 py-0"}
              >
                {shot.hit ? "HIT" : "MISS"}
              </Badge>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )

  return (
    <div className="min-h-screen p-8 monitor-frame">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
<h1 className="text-3xl md:text-4xl font-bold text-balance text-glow uppercase tracking-wider">
            [ BATTLESHIP AI ]
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wide">Terminal Combat System v2.0</p>
        </div>

        {/* Winner Banner */}
        {gameOver && winner && (
          <Card className="p-4 bg-primary/20 text-primary border-primary animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="h-6 w-6" />
              <h2 className="text-xl font-bold text-glow uppercase">
                &gt;&gt; {winner === 1 ? aiModel1 : aiModel2} VICTORY &lt;&lt;
              </h2>
              <Trophy className="h-6 w-6" />
            </div>
          </Card>
        )}

        {/* Battle Grids */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Player 1 */}
          <Card className="p-4 space-y-3 bg-card/80 border-primary/30 grid-glow">
            <div className="flex items-center justify-between border-b border-primary/30 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  [{aiModel1}]
                  {currentPlayer === 1 && !gameOver && (
                    <Badge variant="default" className="animate-pulse text-[10px] px-1 py-0">
                      <Target className="h-2 w-2 mr-1" />
                      ACTIVE
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PLAYER_01</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">{calculateAccuracy(shots1)}%</div>
                <div className="text-[9px] text-muted-foreground uppercase">ACCURACY</div>
              </div>
            </div>
            <div className="flex justify-center">
              <Grid ships={updatedShips2} shots={shots1} showShips={true} />
            </div>
            <div className="space-y-2 border-t border-primary/30 pt-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-hit" />
                  <span>
                    HITS: {shots1.filter((s) => s.hit).length}/{getTotalShipCells(ships2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-miss" />
                  <span>MISSES: {shots1.filter((s) => !s.hit).length}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase">
                SHIPS SUNK: {updatedShips2.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-primary">
                  &gt; SHOT LOG
                </h3>
                {renderShotLog(shots1, aiModel1)}
              </div>
            </div>
          </Card>

          {/* Player 2 */}
          <Card className="p-4 space-y-3 bg-card/80 border-primary/30 grid-glow">
            <div className="flex items-center justify-between border-b border-primary/30 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  [{aiModel2}]
                  {currentPlayer === 2 && !gameOver && (
                    <Badge variant="default" className="animate-pulse text-[10px] px-1 py-0">
                      <Target className="h-2 w-2 mr-1" />
                      ACTIVE
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PLAYER_02</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">{calculateAccuracy(shots2)}%</div>
                <div className="text-[9px] text-muted-foreground uppercase">ACCURACY</div>
              </div>
            </div>
            <div className="flex justify-center">
              <Grid ships={updatedShips1} shots={shots2} showShips={true} />
            </div>
            <div className="space-y-2 border-t border-primary/30 pt-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-hit" />
                  <span>
                    HITS: {shots2.filter((s) => s.hit).length}/{getTotalShipCells(ships1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-miss" />
                  <span>MISSES: {shots2.filter((s) => !s.hit).length}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase">
                SHIPS SUNK: {updatedShips1.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-primary">
                  &gt; SHOT LOG
                </h3>
                {renderShotLog(shots2, aiModel2)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
