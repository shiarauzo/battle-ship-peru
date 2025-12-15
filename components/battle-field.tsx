"use client";

import { useState, useEffect, useCallback } from "react";
import { Grid } from "@/components/grid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Target,
  ArrowLeft,
  Flame,
  Anchor,
  Crosshair,
  User,
} from "lucide-react";
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
  const colors = Array(5).fill("hsl(200, 70%, 35%)");

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

  const [heatmap1, setHeatmap1] = useState<number[][] | undefined>(undefined);
  const [heatmap2, setHeatmap2] = useState<number[][] | undefined>(undefined);
  const [showHeatmap1, setShowHeatmap1] = useState(true);
  const [showHeatmap2, setShowHeatmap2] = useState(true);

  // Check if player 1 is human
  const isPlayer1Human = aiModel1 === "human";
  const isPlayer2Human = aiModel2 === "human";

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
    heatmap?: number[][],
  ): number => {
    if (heatmap && heatmap[row] && heatmap[row][col] !== undefined) {
      return Math.round(heatmap[row][col] * 100);
    }

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

  // Handle human player click
  const handleHumanShot = useCallback(
    (row: number, col: number) => {
      if (gameOver || isThinking) return;

      const isHumanTurn =
        (currentPlayer === 1 && isPlayer1Human) ||
        (currentPlayer === 2 && isPlayer2Human);
      if (!isHumanTurn) return;

      playClick();

      const targetShips = currentPlayer === 1 ? ships2 : ships1;
      const currentShots = currentPlayer === 1 ? shots1 : shots2;

      // Check if already shot here
      if (currentShots.some((s) => s.row === row && s.col === col)) return;

      const hit = targetShips.some((ship) =>
        ship.cells.some((cell) => cell.row === row && cell.col === col),
      );

      const newShot: Shot = {
        row,
        col,
        hit,
        player: currentPlayer,
        confidence: 100, // Human confidence is always 100%
      };

      if (currentPlayer === 1) {
        const newShots = [...shots1, newShot];
        setShots1(newShots);
        const totalCells = getTotalShipCells(ships2);
        const hits = newShots.filter((s) => s.hit).length;
        if (hits === totalCells) {
          setGameOver(true);
          setWinner(1);
          return;
        }
      } else {
        const newShots = [...shots2, newShot];
        setShots2(newShots);
        const totalCells = getTotalShipCells(ships1);
        const hits = newShots.filter((s) => s.hit).length;
        if (hits === totalCells) {
          setGameOver(true);
          setWinner(2);
          return;
        }
      }

      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    },
    [
      currentPlayer,
      gameOver,
      isThinking,
      isPlayer1Human,
      isPlayer2Human,
      ships1,
      ships2,
      shots1,
      shots2,
      playClick,
    ],
  );

  const saveBattle = useCallback(async () => {
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

    // Check if current player is human - if so, don't auto-move
    const isCurrentPlayerHuman =
      (currentPlayer === 1 && isPlayer1Human) ||
      (currentPlayer === 2 && isPlayer2Human);
    if (isCurrentPlayerHuman) return;

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

        if (data.heatmap) {
          if (currentPlayer === 1) {
            setHeatmap1(data.heatmap);
          } else {
            setHeatmap2(data.heatmap);
          }
        }

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

        const confidence = calculateConfidence(
          row,
          col,
          currentShots,
          data.heatmap,
        );

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
    isPlayer1Human,
    isPlayer2Human,
  ]);

  useEffect(() => {
    if (gameOver && winner) {
      saveBattle();
    }
  }, [gameOver, winner, saveBattle]);

  const updatedShips1 = updateSunkShips(ships1, shots2);
  const updatedShips2 = updateSunkShips(ships2, shots1);

  // Determine if player 1's grid should be clickable (when it's human's turn to attack enemy grid)
  const isPlayer1GridClickable =
    currentPlayer === 1 && isPlayer1Human && !gameOver && !isThinking;
  const isPlayer2GridClickable =
    currentPlayer === 2 && isPlayer2Human && !gameOver && !isThinking;

  const renderShotLog = (shots: Shot[], isHuman: boolean) => (
    <div className="h-[120px] w-full rounded border border-cyan-700/40 p-2 bg-black/40 overflow-y-auto">
      <div className="space-y-1">
        {shots.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-2">
            {isHuman ? "CLICK TO ATTACK..." : "WAITING..."}
          </p>
        ) : (
          shots.slice(-10).map((shot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-1.5 rounded bg-cyan-950/30 text-xs border border-cyan-900/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-500/70">
                  #{shots.length - 10 + index + 1}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0 border-cyan-600/50 text-cyan-300"
                >
                  {COLUMNS[shot.col]}
                  {shot.row + 1}
                </Badge>
                {!isHuman && (
                  <span className="text-[9px] text-cyan-400/80 font-mono">
                    {shot.confidence}%
                  </span>
                )}
              </div>
              <Badge
                variant={shot.hit ? "default" : "secondary"}
                className={
                  shot.hit
                    ? "bg-red-600 text-white text-[10px] px-1.5 py-0 border-red-500"
                    : "bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0 border-slate-600"
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

  const getPlayerDisplayName = (model: string) => {
    if (model === "human") return "Human";
    return model;
  };

  return (
    <div className="min-h-screen p-8 monitor-frame hex-pattern">
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
                className="border-cyan-600 text-cyan-400 hover:bg-cyan-950 btn-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-balance text-glow uppercase tracking-wider flex items-center justify-center gap-3">
            <Anchor className="h-8 w-8" />[ NAVAL BATTLE{" "}
            {isPlayer1Human || isPlayer2Human ? "" : "AI"} ]
            <Anchor className="h-8 w-8" />
          </h1>
          <p className="text-cyan-400/70 text-sm uppercase tracking-wide">
            {isPlayer1Human
              ? "Human vs AI - Click on the grid to attack!"
              : "Combat Terminal System v3.0 - Probabilistic AI + Q-Learning"}
          </p>
        </div>

        {gameOver && winner && (
          <Card className="p-4 bg-cyan-900/30 text-cyan-300 border-cyan-500 animate-pulse card-relief">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-glow uppercase">
                &gt;&gt;{" "}
                {getPlayerDisplayName(winner === 1 ? aiModel1 : aiModel2)}{" "}
                VICTORY &lt;&lt;
              </h2>
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
          </Card>
        )}

        {/* Human turn indicator */}
        {isPlayer1Human && currentPlayer === 1 && !gameOver && (
          <Card className="p-3 bg-yellow-900/30 text-yellow-300 border-yellow-600/50 card-relief">
            <div className="flex items-center justify-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="uppercase font-bold">
                Your Turn - Click on the enemy grid to fire!
              </span>
              <Crosshair className="h-4 w-4 animate-pulse" />
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Player 1 Card */}
          <Card className="p-4 space-y-3 card-relief">
            <div className="flex items-center justify-between border-b border-cyan-700/40 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  {isPlayer1Human ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Crosshair className="h-4 w-4" />
                  )}
                  [{getPlayerDisplayName(aiModel1)}]
                  {currentPlayer === 1 && !gameOver && (
                    <Badge
                      variant="default"
                      className={`animate-pulse text-[10px] px-1.5 py-0 ${isPlayer1Human ? "bg-yellow-600" : "bg-cyan-600"}`}
                    >
                      <Target className="h-2 w-2 mr-1" />
                      {isPlayer1Human
                        ? "YOUR TURN"
                        : isThinking
                          ? "THINKING..."
                          : "ACTIVE"}
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-cyan-500/70 uppercase tracking-wide">
                  PLAYER_01 {isPlayer1Human && "(YOU)"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">
                  {calculateAccuracy(shots1)}%
                </div>
                <div className="text-[9px] text-cyan-500/70 uppercase">
                  ACCURACY
                </div>
              </div>
            </div>

            {/* Heatmap Toggle - Only show for AI players */}
            {!isPlayer1Human && (
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    playClick();
                    setShowHeatmap1(!showHeatmap1);
                  }}
                  variant={showHeatmap1 ? "default" : "outline"}
                  size="sm"
                  className={`text-[10px] h-6 ${
                    showHeatmap1
                      ? "bg-orange-600 hover:bg-orange-700 border-orange-500"
                      : "border-orange-600 text-orange-400 hover:bg-orange-950"
                  }`}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  HEATMAP
                </Button>
                <div className="text-[9px] text-cyan-500/70">
                  {heatmap1 ? "PROBABILISTIC AI" : "LOADING..."}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Grid
                ships={updatedShips2}
                shots={shots1}
                showShips={!isPlayer1Human || gameOver}
                heatmap={isPlayer1Human ? undefined : heatmap1}
                showHeatmap={!isPlayer1Human && showHeatmap1}
                onCellClick={
                  isPlayer1GridClickable ? handleHumanShot : undefined
                }
                isClickable={isPlayer1GridClickable}
              />
            </div>
            <div className="space-y-2 border-t border-cyan-700/40 pt-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3 w-3 rounded bg-red-600 hit-marker"
                    style={{ position: "relative" }}
                  />
                  <span className="text-cyan-300">
                    HITS: {shots1.filter((s) => s.hit).length}/
                    {getTotalShipCells(ships2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-slate-600" />
                  <span className="text-cyan-300">
                    MISSES: {shots1.filter((s) => !s.hit).length}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-cyan-500/70 uppercase">
                SHIPS DESTROYED: {updatedShips2.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-cyan-400">
                  &gt; SHOT LOG
                </h3>
                {renderShotLog(shots1, isPlayer1Human)}
              </div>
            </div>
          </Card>

          {/* Player 2 Card */}
          <Card className="p-4 space-y-3 card-relief">
            <div className="flex items-center justify-between border-b border-cyan-700/40 pb-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-glow uppercase">
                  {isPlayer2Human ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Crosshair className="h-4 w-4" />
                  )}
                  [{getPlayerDisplayName(aiModel2)}]
                  {currentPlayer === 2 && !gameOver && (
                    <Badge
                      variant="default"
                      className={`animate-pulse text-[10px] px-1.5 py-0 ${isPlayer2Human ? "bg-yellow-600" : "bg-cyan-600"}`}
                    >
                      <Target className="h-2 w-2 mr-1" />
                      {isPlayer2Human
                        ? "YOUR TURN"
                        : isThinking
                          ? "THINKING..."
                          : "ACTIVE"}
                    </Badge>
                  )}
                </h2>
                <p className="text-[10px] text-cyan-500/70 uppercase tracking-wide">
                  PLAYER_02 {isPlayer2Human && "(YOU)"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-glow">
                  {calculateAccuracy(shots2)}%
                </div>
                <div className="text-[9px] text-cyan-500/70 uppercase">
                  ACCURACY
                </div>
              </div>
            </div>

            {/* Heatmap Toggle - Only show for AI players */}
            {!isPlayer2Human && (
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    playClick();
                    setShowHeatmap2(!showHeatmap2);
                  }}
                  variant={showHeatmap2 ? "default" : "outline"}
                  size="sm"
                  className={`text-[10px] h-6 ${
                    showHeatmap2
                      ? "bg-orange-600 hover:bg-orange-700 border-orange-500"
                      : "border-orange-600 text-orange-400 hover:bg-orange-950"
                  }`}
                >
                  <Flame className="h-3 w-3 mr-1" />
                  HEATMAP
                </Button>
                <div className="text-[9px] text-cyan-500/70">
                  {heatmap2 ? "PROBABILISTIC AI" : "LOADING..."}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Grid
                ships={updatedShips1}
                shots={shots2}
                showShips={true}
                heatmap={isPlayer2Human ? undefined : heatmap2}
                showHeatmap={!isPlayer2Human && showHeatmap2}
                onCellClick={
                  isPlayer2GridClickable ? handleHumanShot : undefined
                }
                isClickable={isPlayer2GridClickable}
              />
            </div>
            <div className="space-y-2 border-t border-cyan-700/40 pt-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3 w-3 rounded bg-red-600 hit-marker"
                    style={{ position: "relative" }}
                  />
                  <span className="text-cyan-300">
                    HITS: {shots2.filter((s) => s.hit).length}/
                    {getTotalShipCells(ships1)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-slate-600" />
                  <span className="text-cyan-300">
                    MISSES: {shots2.filter((s) => !s.hit).length}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-cyan-500/70 uppercase">
                SHIPS DESTROYED: {updatedShips1.filter((s) => s.sunk).length}/5
              </div>
              <div className="pt-1">
                <h3 className="text-[10px] font-semibold mb-1 uppercase tracking-wide text-cyan-400">
                  &gt; SHOT LOG
                </h3>
                {renderShotLog(shots2, isPlayer2Human)}
              </div>
            </div>
          </Card>
        </div>

        {/* Heatmap Legend - Only show if at least one AI player */}
        {(!isPlayer1Human || !isPlayer2Human) && (
          <Card className="p-3 card-relief">
            <div className="flex items-center justify-center gap-4 text-[10px]">
              <span className="text-cyan-400 uppercase font-semibold">
                Heatmap Legend:
              </span>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "rgba(0, 100, 180, 0.5)" }}
                />
                <span className="text-cyan-300">0-20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "rgba(0, 150, 200, 0.5)" }}
                />
                <span className="text-cyan-300">20-40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "rgba(0, 200, 220, 0.6)" }}
                />
                <span className="text-cyan-300">40-60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "rgba(255, 150, 50, 0.7)" }}
                />
                <span className="text-cyan-300">60-80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "rgba(255, 80, 80, 0.9)" }}
                />
                <span className="text-cyan-300">80-100%</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
