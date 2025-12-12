// lib/q-learning.ts
// Sistema de Q-Learning para Battleship AI

export interface QState {
  mode:
    | "hunt_early"
    | "hunt_mid"
    | "hunt_late"
    | "target_1hit"
    | "target_2hit_h"
    | "target_2hit_v";
  hitsCount: number;
  activeHitsCount: number;
}

export interface QAction {
  type:
    | "center_focus"
    | "checkerboard"
    | "adjacent"
    | "continue_direction"
    | "random";
  targetCell?: { row: number; col: number };
}

export interface QValueEntry {
  model: string;
  state: string;
  action: string;
  qValue: number;
  visitCount: number;
  learningRate: number;
  discountFactor: number;
}

export interface Shot {
  row: number;
  col: number;
  hit: boolean;
}

export interface ModelHyperparameters {
  learningRate: number; // α: 0.01 - 0.5
  discountFactor: number; // γ: 0.8 - 0.99
  explorationRate: number; // ε: para ε-greedy
}

// Valores por defecto
const DEFAULT_HYPERPARAMETERS: ModelHyperparameters = {
  learningRate: 0.1,
  discountFactor: 0.9,
  explorationRate: 0.15,
};

// Recompensas
const REWARDS = {
  HIT: 10,
  SINK: 50,
  MISS: -1,
  WIN: 100,
  LOSE: -50,
};

const GRID_SIZE = 8;
const ACTIONS = [
  "center_focus",
  "checkerboard",
  "adjacent",
  "continue_direction",
] as const;

/**
 * Determina el estado actual del juego para Q-Learning
 */
export function determineState(shots: Shot[]): QState {
  const totalShots = shots.length;
  const hits = shots.filter((s) => s.hit);
  const hitsCount = hits.length;

  // Encontrar hits "activos" (probablemente de barcos no hundidos)
  const activeHits = findActiveHits(shots);
  const activeHitsCount = activeHits.length;

  // Determinar modo
  let mode: QState["mode"];

  if (activeHitsCount === 0) {
    // Modo Hunt
    if (totalShots < 10) {
      mode = "hunt_early";
    } else if (totalShots < 25) {
      mode = "hunt_mid";
    } else {
      mode = "hunt_late";
    }
  } else if (activeHitsCount === 1) {
    mode = "target_1hit";
  } else {
    // 2+ hits activos, determinar dirección
    const direction = detectHitDirection(activeHits);
    mode = direction === "horizontal" ? "target_2hit_h" : "target_2hit_v";
  }

  return { mode, hitsCount, activeHitsCount };
}

/**
 * Encuentra hits que probablemente pertenecen a barcos no hundidos
 */
function findActiveHits(shots: Shot[]): Shot[] {
  const hits = shots.filter((s) => s.hit);
  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));

  return hits.filter((hit) => {
    const adjacentCells = [
      { row: hit.row - 1, col: hit.col },
      { row: hit.row + 1, col: hit.col },
      { row: hit.row, col: hit.col - 1 },
      { row: hit.row, col: hit.col + 1 },
    ];

    // Un hit está activo si tiene al menos una celda adyacente sin disparar
    return adjacentCells.some(
      (cell) =>
        cell.row >= 0 &&
        cell.row < GRID_SIZE &&
        cell.col >= 0 &&
        cell.col < GRID_SIZE &&
        !shotSet.has(`${cell.row},${cell.col}`),
    );
  });
}

/**
 * Detecta la dirección de un grupo de hits
 */
function detectHitDirection(
  hits: Shot[],
): "horizontal" | "vertical" | "unknown" {
  if (hits.length < 2) return "unknown";

  // Buscar hits adyacentes
  for (let i = 0; i < hits.length; i++) {
    for (let j = i + 1; j < hits.length; j++) {
      if (
        hits[i].row === hits[j].row &&
        Math.abs(hits[i].col - hits[j].col) === 1
      ) {
        return "horizontal";
      }
      if (
        hits[i].col === hits[j].col &&
        Math.abs(hits[i].row - hits[j].row) === 1
      ) {
        return "vertical";
      }
    }
  }

  return "unknown";
}

/**
 * Serializa el estado para usar como key
 */
export function serializeState(state: QState): string {
  return `${state.mode}:hits=${state.hitsCount}:active=${state.activeHitsCount}`;
}

/**
 * Selecciona la mejor acción usando ε-greedy
 */
export function selectAction(
  state: QState,
  qTable: Map<string, number>,
  explorationRate: number = DEFAULT_HYPERPARAMETERS.explorationRate,
): string {
  const stateKey = serializeState(state);

  // Exploración: acción aleatoria
  if (Math.random() < explorationRate) {
    return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }

  // Explotación: mejor acción conocida
  let bestAction: (typeof ACTIONS)[number] = ACTIONS[0];
  let bestValue = -Infinity;

  for (const action of ACTIONS) {
    const key = `${stateKey}:${action}`;
    const value = qTable.get(key) || 0;

    if (value > bestValue) {
      bestValue = value;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * Obtiene celdas objetivo basadas en la acción seleccionada
 */
export function getTargetCellsForAction(
  action: string,
  shots: Shot[],
  topProbabilityCells: { row: number; col: number; probability: number }[],
): { row: number; col: number }[] {
  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));
  const hits = shots.filter((s) => s.hit);
  const activeHits = findActiveHits(shots);

  const availableCells: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!shotSet.has(`${row},${col}`)) {
        availableCells.push({ row, col });
      }
    }
  }

  switch (action) {
    case "center_focus": {
      // Priorizar celdas cercanas al centro
      return availableCells
        .map((cell) => ({
          ...cell,
          distance: Math.sqrt(
            Math.pow(cell.row - 3.5, 2) + Math.pow(cell.col - 3.5, 2),
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
    }

    case "checkerboard": {
      // Patrón de tablero de ajedrez
      return availableCells
        .filter((cell) => (cell.row + cell.col) % 2 === 0)
        .slice(0, 5);
    }

    case "adjacent": {
      // Celdas adyacentes a hits activos
      const adjacentCells: { row: number; col: number }[] = [];

      for (const hit of activeHits) {
        const neighbors = [
          { row: hit.row - 1, col: hit.col },
          { row: hit.row + 1, col: hit.col },
          { row: hit.row, col: hit.col - 1 },
          { row: hit.row, col: hit.col + 1 },
        ];

        for (const neighbor of neighbors) {
          if (
            neighbor.row >= 0 &&
            neighbor.row < GRID_SIZE &&
            neighbor.col >= 0 &&
            neighbor.col < GRID_SIZE &&
            !shotSet.has(`${neighbor.row},${neighbor.col}`)
          ) {
            adjacentCells.push(neighbor);
          }
        }
      }

      // Eliminar duplicados
      const unique = Array.from(
        new Set(adjacentCells.map((c) => `${c.row},${c.col}`)),
      ).map((key) => {
        const [row, col] = key.split(",").map(Number);
        return { row, col };
      });

      return unique.length > 0 ? unique : topProbabilityCells.slice(0, 3);
    }

    case "continue_direction": {
      // Continuar en la dirección detectada del barco
      if (activeHits.length < 2) {
        return getTargetCellsForAction("adjacent", shots, topProbabilityCells);
      }

      const direction = detectHitDirection(activeHits);
      const targetCells: { row: number; col: number }[] = [];

      // Encontrar extremos del cluster de hits
      const sortedHits = [...activeHits];

      if (direction === "horizontal") {
        sortedHits.sort((a, b) => a.col - b.col);
        const row = sortedHits[0].row;
        const minCol = sortedHits[0].col;
        const maxCol = sortedHits[sortedHits.length - 1].col;

        // Intentar extender a izquierda y derecha
        if (minCol > 0 && !shotSet.has(`${row},${minCol - 1}`)) {
          targetCells.push({ row, col: minCol - 1 });
        }
        if (maxCol < GRID_SIZE - 1 && !shotSet.has(`${row},${maxCol + 1}`)) {
          targetCells.push({ row, col: maxCol + 1 });
        }
      } else if (direction === "vertical") {
        sortedHits.sort((a, b) => a.row - b.row);
        const col = sortedHits[0].col;
        const minRow = sortedHits[0].row;
        const maxRow = sortedHits[sortedHits.length - 1].row;

        // Intentar extender arriba y abajo
        if (minRow > 0 && !shotSet.has(`${minRow - 1},${col}`)) {
          targetCells.push({ row: minRow - 1, col });
        }
        if (maxRow < GRID_SIZE - 1 && !shotSet.has(`${maxRow + 1},${col}`)) {
          targetCells.push({ row: maxRow + 1, col });
        }
      }

      return targetCells.length > 0
        ? targetCells
        : getTargetCellsForAction("adjacent", shots, topProbabilityCells);
    }

    default:
      return topProbabilityCells.slice(0, 5);
  }
}

/**
 * Calcula la recompensa para un movimiento
 */
export function calculateReward(
  hit: boolean,
  sunkShip: boolean = false,
  wonGame: boolean = false,
  lostGame: boolean = false,
): number {
  let reward = hit ? REWARDS.HIT : REWARDS.MISS;

  if (sunkShip) {
    reward += REWARDS.SINK;
  }

  if (wonGame) {
    reward += REWARDS.WIN;
  } else if (lostGame) {
    reward += REWARDS.LOSE;
  }

  return reward;
}

/**
 * Actualiza el Q-value usando TD-learning
 * Q(s,a) = Q(s,a) + α[R + γ*maxQ(s') - Q(s,a)]
 */
export function updateQValue(
  qTable: Map<string, number>,
  stateKey: string,
  action: string,
  reward: number,
  nextStateKey: string,
  hyperparameters: ModelHyperparameters = DEFAULT_HYPERPARAMETERS,
): number {
  const { learningRate, discountFactor } = hyperparameters;

  const key = `${stateKey}:${action}`;
  const currentQ = qTable.get(key) || 0;

  // Encontrar máximo Q-value del siguiente estado
  let maxNextQ = 0;
  for (const nextAction of ACTIONS) {
    const nextKey = `${nextStateKey}:${nextAction}`;
    const nextQ = qTable.get(nextKey) || 0;
    if (nextQ > maxNextQ) {
      maxNextQ = nextQ;
    }
  }

  // TD-learning update
  const newQ =
    currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);

  qTable.set(key, newQ);

  return newQ;
}

/**
 * Procesa una batalla completa y actualiza Q-values
 */
export function processBattleForLearning(
  moves: {
    row: number;
    col: number;
    hit: boolean;
    wasFollowUp: boolean;
  }[],
  won: boolean,
  hyperparameters: ModelHyperparameters = DEFAULT_HYPERPARAMETERS,
): Map<string, { qValue: number; visitCount: number }> {
  const qUpdates = new Map<string, { qValue: number; visitCount: number }>();
  const qTable = new Map<string, number>();

  // Reconstruir estados y acciones para cada movimiento
  const shots: Shot[] = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const state = determineState(shots);
    const stateKey = serializeState(state);

    // Determinar la acción que se tomó
    const action = move.wasFollowUp ? "adjacent" : inferAction(move, shots);

    // Calcular recompensa
    const isLastMove = i === moves.length - 1;
    const reward = calculateReward(
      move.hit,
      false, // TODO: detectar si hundió un barco
      isLastMove && won,
      isLastMove && !won,
    );

    // Añadir el disparo actual
    shots.push({ row: move.row, col: move.col, hit: move.hit });

    // Calcular siguiente estado
    const nextState = determineState(shots);
    const nextStateKey = serializeState(nextState);

    // Actualizar Q-value
    const newQ = updateQValue(
      qTable,
      stateKey,
      action,
      reward,
      nextStateKey,
      hyperparameters,
    );

    // Guardar actualización
    const key = `${stateKey}:${action}`;
    const existing = qUpdates.get(key);
    qUpdates.set(key, {
      qValue: newQ,
      visitCount: (existing?.visitCount || 0) + 1,
    });
  }

  return qUpdates;
}

/**
 * Infiere la acción basándose en el movimiento realizado
 */
function inferAction(
  move: { row: number; col: number },
  previousShots: Shot[],
): string {
  // Si no hay hits previos, fue hunting
  const previousHits = previousShots.filter((s) => s.hit);

  if (previousHits.length === 0) {
    // Verificar si es patrón checkerboard
    if ((move.row + move.col) % 2 === 0) {
      return "checkerboard";
    }

    // Verificar si está cerca del centro
    const distanceFromCenter = Math.sqrt(
      Math.pow(move.row - 3.5, 2) + Math.pow(move.col - 3.5, 2),
    );
    if (distanceFromCenter < 2.5) {
      return "center_focus";
    }

    return "checkerboard";
  }

  // Verificar si el movimiento es adyacente a algún hit
  const isAdjacent = previousHits.some(
    (hit) =>
      (Math.abs(hit.row - move.row) === 1 && hit.col === move.col) ||
      (Math.abs(hit.col - move.col) === 1 && hit.row === move.row),
  );

  if (isAdjacent) {
    // Verificar si continúa una dirección
    const direction = detectHitDirection(previousHits);
    if (direction !== "unknown") {
      return "continue_direction";
    }
    return "adjacent";
  }

  return "checkerboard";
}

/**
 * Convierte Q-updates a formato para base de datos
 */
export function formatQUpdatesForDB(
  model: string,
  qUpdates: Map<string, { qValue: number; visitCount: number }>,
  hyperparameters: ModelHyperparameters = DEFAULT_HYPERPARAMETERS,
): QValueEntry[] {
  const entries: QValueEntry[] = [];

  qUpdates.forEach((value, key) => {
    const [stateAction] = key.split(":").slice(-1);
    const stateParts = key.split(":");
    const action = stateParts.pop()!;
    const state = stateParts.join(":");

    entries.push({
      model,
      state,
      action,
      qValue: value.qValue,
      visitCount: value.visitCount,
      learningRate: hyperparameters.learningRate,
      discountFactor: hyperparameters.discountFactor,
    });
  });

  return entries;
}

/**
 * Carga Q-table desde entradas de base de datos
 */
export function loadQTableFromDB(entries: QValueEntry[]): Map<string, number> {
  const qTable = new Map<string, number>();

  for (const entry of entries) {
    const key = `${entry.state}:${entry.action}`;
    qTable.set(key, entry.qValue);
  }

  return qTable;
}

/**
 * Obtiene hiperparámetros por defecto o los proporcionados
 */
export function getHyperparameters(
  custom?: Partial<ModelHyperparameters>,
): ModelHyperparameters {
  return {
    ...DEFAULT_HYPERPARAMETERS,
    ...custom,
  };
}

export { REWARDS, ACTIONS, DEFAULT_HYPERPARAMETERS };
