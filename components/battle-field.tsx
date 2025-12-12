"use client";

import { useState, useEffect, useCallback } from "react";
import { Grid } from "@/components/grid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClickSound } from "@/hooks/useClickSound";

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
  player: 1 | 2;
  confidence: number;
  wasFollowUp?: boolean;
  previousHits?: { row: number; col: number }[];
}

interface BattleFieldProps {
  aiModel1: string;
  aiModel2: string;
  onBackToMenu?: () => void;
}

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const generateShips = (): Ship[] => {
  const ships: Ship[] = [];
  const shipSizes = [5, 4, 3, 3, 2];
  const colors = Array(5).fill("hsl(160, 50%, 40%)");

  const occupied = new Set<string>();

  for (let i = 0; i < shipSizes.length; i++) {
    const size = shipSizes[i];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * 8);
      const col = Math.floor(Math.random() * 8);

      if (horizontal && col + size > 8) continue;
      if (!horizontal && row + size > 8) continue;

      const cells: { row: number; col: number }[] = [];
      let canPlace = true;

      for (let j = 0; j < size; j++) {
        const cellRow = horizontal ? row : row + j;
        const cellCol = horizontal ? col + j : col;
        const key = `${cellRow},${cellCol}`;

        if (occupied.has(key)) {
          canPlace = false;
          break;
        }
        cells.push({ row: cellRow, col: cellCol });
      }

      if (canPlace) {
        cells.forEach((cell) => occupied.add(`${cell.row},${cell.col}`));
        ships.push({
          id: i,
          cells,
          sunk: false,
          color: colors[i],
        });
        placed = true;
      }
    }
  }

  return ships;
};

export function BattleField({
  aiModel1,
  aiModel2,
  onBackToMenu,
}: BattleFieldProps) {
  const [ships1] = useState<Ship[]>(generateShips());
  const [ships2] = useState<Ship[]>(generateShips());
  const [shots1, setShots1] = useState<Shot[]>([]);
  const [shots2, setShots2] = useState<Shot[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const { playClick } = useClickSound();

  const updateSunkShips = (ships: Ship[], shots: Shot[]): Ship[] => {
    return ships.map((ship) => {
      const allCellsHit = ship.cells.every((cell) =>
        shots.some(
          (shot) => shot.row === cell.row && shot.col === cell.col && shot.hit,
        ),
      );
      return { ...ship, sunk: allCellsHit };
    });
  };

  const calculateAccuracy = (shots: Shot[]) => {
    if (shots.length === 0) return 0;
    const hits = shots.filter((s) => s.hit).length;
    return Math.round((hits / shots.length) * 100);
  };

  const getTotalShipCells = (ships: Ship[]) => {
    return ships.reduce((total, ship) => total + ship.cells.length, 0);
  };

  const calculateConfidence = (
    row: number,
    col: number,
    currentShots: Shot[],
  ): number => {
    let confidence = 45 + Math.random() * 30;

    const nearbyHits = currentShots.filter(
      (s) => s.hit && Math.abs(s.row - row) <= 1 && Math.abs(s.col - col) <= 1,
    );
    confidence += nearbyHits.length * 15;

    const distanceFromCenter = Math.abs(row - 3.5) + Math.abs(col - 3.5);
    if (distanceFromCenter < 3) {
      confidence += 10;
    }

    return Math.min(98, Math.round(confidence));
  };

  const saveBattle = useCallback(async () => {
    // Prepare moves data for learning
    const allMoves = [
      ...shots1.map((shot, idx) => ({
        model: aiModel1,
        moveNumber: idx + 1,
        row: shot.row,
        col: shot.col,
        hit: shot.hit,
        wasFollowUp: shot.wasFollowUp || false,
        previousHits: shot.previousHits || [],
      })),
      ...shots2.map((shot, idx) => ({
        model: aiModel2,
        moveNumber: idx + 1,
        row: shot.row,
        col: shot.col,
        hit: shot.hit,
        wasFollowUp: shot.wasFollowUp || false,
        previousHits: shot.previousHits || [],
      })),
    ];

    await fetch("/api/save-battle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelA: aiModel1,
        modelB: aiModel2,
        accuracyA: calculateAccuracy(shots1),
        accuracyB: calculateAccuracy(shots2),
        hitsA: shots1.filter((s) => s.hit).length,
        hitsB: shots2.filter((s) => s.hit).length,
        missesA: shots1.filter((s) => !s.hit).length,
        missesB: shots2.filter((s) => !s.hit).length,
        winner: winner === 1 ? aiModel1 : aiModel2,
        moves: allMoves,
      }),
    });
  }, [aiModel1, aiModel2, shots1, shots2, winner]);

  useEffect(() => {
    if (gameOver || isThinking) return;

    const makeMove = async () => {
      setIsThinking(true);
      const targetShips = currentPlayer === 1 ? ships2 : ships1;
      const currentShots = currentPlayer === 1 ? shots1 : shots2;
      const currentModel = currentPlayer === 1 ? aiModel1 : aiModel2;

      try {
        const response = await fetch("/api/ai-move", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: currentModel,
            previousShots: currentShots.map((shot) => ({
              row: shot.row,
              col: shot.col,
              hit: shot.hit,
            })),
            gridSize: 8,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        let row = data.row;
        let col = data.col;

        if (
          row === undefined ||
          col === undefined ||
          currentShots.some((s) => s.row === row && s.col === col)
        ) {
          let attempts = 0;
          do {
            row = Math.floor(Math.random() * 8);
            col = Math.floor(Math.random() * 8);
            attempts++;
          } while (
            attempts < 100 &&
            currentShots.some((s) => s.row === row && s.col === col)
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 300));

        const hit = targetShips.some((ship) =>
          ship.cells.some((cell) => cell.row === row && cell.col === col),
        );

        const confidence = calculateConfidence(row, col, currentShots);

        const newShot: Shot = {
          row,
          col,
          hit,
          player: currentPlayer,
          confidence,
          wasFollowUp: data.wasFollowUp || false,
          previousHits: data.previousHits || [],
        };

        if (currentPlayer === 1) {
          const newShots = [...shots1, newShot];
          setShots1(newShots);
          const totalCells = getTotalShipCells(ships2);
          const hits = newShots.filter((s) => s.hit).length;
          if (hits === totalCells) {
            setGameOver(true);
            setWinner(1);
          }
        } else {
          const newShots = [...shots2, newShot];
          setShots2(newShots);
          const totalCells = getTotalShipCells(ships1);
          const hits = newShots.filter((s) => s.hit).length;
          if (hits === totalCells) {
            setGameOver(true);
            setWinner(2);
          }
        }

        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      } catch (error) {
        console.error("Error making AI move:", error);
        let row: number, col: number;
        let attempts = 0;
        do {
          row = Math.floor(Math.random() * 8);
          col = Math.floor(Math.random() * 8);
          attempts++;
        } while (
          attempts < 100 &&
          currentShots.some((s) => s.row === row && s.col === col)
        );

        const hit = targetShips.some((ship) =>
          ship.cells.some((cell) => cell.row === row && cell.col === col),
        );

        const confidence = calculateConfidence(row, col, currentShots);

        const newShot: Shot = {
          row,
          col,
          hit,
          player: currentPlayer,
          confidence,
        };

        if (currentPlayer === 1) {
          const newShots = [...shots1, newShot];
          setShots1(newShots);
          const totalCells = getTotalShipCells(ships2);
          const hits = newShots.filter((s) => s.hit).length;
          if (hits === totalCells) {
            setGameOver(true);
            setWinner(1);
          }
        } else {
          const newShots = [...shots2, newShot];
          setShots2(newShots);
          const totalCells = getTotalShipCells(ships1);
          const hits = newShots.filter((s) => s.hit).length;
          if (hits === totalCells) {
            setGameOver(true);
            setWinner(2);
          }
        }

        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      } finally {
        setIsThinking(false);
      }
    };

    const timer = setTimeout(() => {
      makeMove();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    currentPlayer,
    gameOver,
    ships1,
    ships2,
    shots1,
    shots2,
    aiModel1,
    aiModel2,
    isThinking,
  ]);

  useEffect(() => {
    if (gameOver && winner) {
      saveBattle();
    }
  }, [gameOver, winner, saveBattle]);

  const updatedShips1 = updateSunkShips(ships1, shots2);
  const updatedShips2 = updateSunkShips(ships2, shots1);

  const renderShotLog = (shots: Shot[]) => (
    <div className="h-[150px] w-full rounded border border-primary/30 p-2 bg-card/50 overflow-y-auto">
      <div className="space-y-1">
        {shots.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-2">
            ESPERANDO...
          </p>
        ) : (
          shots.map((shot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-1.5 rounded bg-muted/30 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  #{index + 1}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1 py-0"
                >
                  {COLUMNS[shot.col]}
                  {shot.row + 1}
                </Badge>
                <span className="text-[9px] text-primary/80 font-mono">
                  {shot.confidence}%
                </span>
              </div>
              <Badge
                variant={shot.hit ? "default" : "secondary"}
                className={
                  shot.hit
                    ? "bg-hit text-[10px] px-1 py-0"
                    : "bg-miss text-[10px] px-1 py-0"
                }
              >
                {shot.hit ? "HIT" : "MISS"}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 monitor-frame">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          {onBackToMenu && (
            <div className="flex justify-start">
              <Button
                onClick={() => {
                  playClick();
                  onBackToMenu();
                }}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-950"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-balance text-glow uppercase tracking-wider">
            [ BATALLA NAVAL IA ]
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wide">
            Sistema de Combate Terminal v2.0
          </p>
        </div>

        {gameOver && winner && (
          <Card className="p-4 bg-primary/20 text-primary border-primary animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="h-6 w-6" />
              <h2 className="text-xl font-bold text-glow uppercase">
                &gt;&gt; {winner === 1 ? aiModel1 : aiModel2} VICTORIA &lt;&lt;
              </h2>
              <Trophy className="h-6 w-6" />
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3 bg-card/80 border-primary/30 grid-glow">
            <div className="flex items-center justify-between border-b border-primary/30 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  [{aiModel1}]
                  {currentPlayer === 1 && !gameOver && (
                    <Badge
                      variant="default"
                      className="animate-pulse text-[10px] px-1 py-0"
                    >
                      <Target className="h-2 w-2 mr-1" />
                      {isThinking ? "PENSANDO..." : "ACTIVO"}
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  JUGADOR_01
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">
                  {calculateAccuracy(shots1)}%
                </div>
                <div className="text-[9px] text-muted-foreground uppercase">
                  PRECISION
                </div>
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
                    IMPACTOS: {shots1.filter((s) => s.hit).length}/
                    {getTotalShipCells(ships2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-miss" />
                  <span>FALLOS: {shots1.filter((s) => !s.hit).length}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase">
                BARCOS HUNDIDOS: {updatedShips2.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-primary">
                  &gt; REGISTRO DE DISPAROS
                </h3>
                {renderShotLog(shots1)}
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-card/80 border-primary/30 grid-glow">
            <div className="flex items-center justify-between border-b border-primary/30 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  [{aiModel2}]
                  {currentPlayer === 2 && !gameOver && (
                    <Badge
                      variant="default"
                      className="animate-pulse text-[10px] px-1 py-0"
                    >
                      <Target className="h-2 w-2 mr-1" />
                      {isThinking ? "PENSANDO..." : "ACTIVO"}
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  JUGADOR_02
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">
                  {calculateAccuracy(shots2)}%
                </div>
                <div className="text-[9px] text-muted-foreground uppercase">
                  PRECISION
                </div>
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
                    IMPACTOS: {shots2.filter((s) => s.hit).length}/
                    {getTotalShipCells(ships1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-miss" />
                  <span>FALLOS: {shots2.filter((s) => !s.hit).length}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase">
                BARCOS HUNDIDOS: {updatedShips1.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-primary">
                  &gt; REGISTRO DE DISPAROS
                </h3>
                {renderShotLog(shots2)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
