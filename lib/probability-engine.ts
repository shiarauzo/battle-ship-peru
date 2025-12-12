// lib/probability-engine.ts
// Motor de probabilidad bayesiano para Battleship AI

export interface ProbabilityMap {
  grid: number[][]; // 8x8 probabilidades 0-1
  topCells: { row: number; col: number; probability: number }[];
}

export interface Shot {
  row: number;
  col: number;
  hit: boolean;
}

export interface ShipInfo {
  size: number;
  sunk: boolean;
}

const GRID_SIZE = 8;
const SHIP_SIZES = [5, 4, 3, 3, 2]; // Total: 17 cells

/**
 * Genera el mapa de calor de probabilidades inicial
 * Basado en: posición central, patrón checkerboard, y donde caben los barcos
 */
export function generateInitialProbabilityMap(): number[][] {
  const grid: number[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));

  // Probabilidad base: centro tiene más probabilidad que bordes
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      // Distancia al centro (3.5, 3.5)
      const distanceFromCenter = Math.sqrt(
        Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
      );
      // Normalizar: centro = 1, esquinas ≈ 0.3
      const centerWeight = 1 - distanceFromCenter / 7;

      // Patrón checkerboard para hunting eficiente
      const checkerboardBonus = (row + col) % 2 === 0 ? 0.1 : 0;

      grid[row][col] = 0.3 + centerWeight * 0.4 + checkerboardBonus;
    }
  }

  return normalizeGrid(grid);
}

/**
 * Calcula cuántas posiciones válidas de barcos pasan por cada celda
 * Considera los tamaños de barcos restantes
 */
export function calculateShipPlacementProbability(
  shots: Shot[],
  remainingShipSizes: number[]
): number[][] {
  const grid: number[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));

  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));
  const missSet = new Set(
    shots.filter((s) => !s.hit).map((s) => `${s.row},${s.col}`)
  );

  // Para cada tamaño de barco restante
  for (const shipSize of remainingShipSizes) {
    // Probar todas las posiciones horizontales
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col <= GRID_SIZE - shipSize; col++) {
        let validPlacement = true;
        const cells: { row: number; col: number }[] = [];

        for (let i = 0; i < shipSize; i++) {
          const key = `${row},${col + i}`;
          if (missSet.has(key)) {
            validPlacement = false;
            break;
          }
          cells.push({ row, col: col + i });
        }

        if (validPlacement) {
          // Añadir probabilidad a cada celda de esta posición válida
          for (const cell of cells) {
            if (!shotSet.has(`${cell.row},${cell.col}`)) {
              grid[cell.row][cell.col] += 1;
            }
          }
        }
      }
    }

    // Probar todas las posiciones verticales
    for (let row = 0; row <= GRID_SIZE - shipSize; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        let validPlacement = true;
        const cells: { row: number; col: number }[] = [];

        for (let i = 0; i < shipSize; i++) {
          const key = `${row + i},${col}`;
          if (missSet.has(key)) {
            validPlacement = false;
            break;
          }
          cells.push({ row: row + i, col });
        }

        if (validPlacement) {
          for (const cell of cells) {
            if (!shotSet.has(`${cell.row},${cell.col}`)) {
              grid[cell.row][cell.col] += 1;
            }
          }
        }
      }
    }
  }

  return normalizeGrid(grid);
}

/**
 * Actualización bayesiana después de un hit
 * Aumenta probabilidad en celdas adyacentes en línea con el hit
 */
export function updateProbabilityAfterHit(
  grid: number[][],
  hitRow: number,
  hitCol: number,
  previousHits: Shot[]
): number[][] {
  const newGrid = grid.map((row) => [...row]);

  // Marcar la celda golpeada como 0 (ya disparada)
  newGrid[hitRow][hitCol] = 0;

  // Encontrar hits adyacentes para determinar dirección del barco
  const adjacentHits = previousHits.filter(
    (h) =>
      h.hit &&
      ((Math.abs(h.row - hitRow) === 1 && h.col === hitCol) ||
        (Math.abs(h.col - hitCol) === 1 && h.row === hitRow))
  );

  if (adjacentHits.length > 0) {
    // Barco detectado, aumentar probabilidad en la dirección del barco
    const isHorizontal = adjacentHits.some((h) => h.row === hitRow);
    const isVertical = adjacentHits.some((h) => h.col === hitCol);

    if (isHorizontal) {
      // Aumentar probabilidad a izquierda y derecha
      for (let dc = -1; dc <= 1; dc += 2) {
        const newCol = hitCol + dc;
        if (newCol >= 0 && newCol < GRID_SIZE && newGrid[hitRow][newCol] > 0) {
          newGrid[hitRow][newCol] = Math.min(1, newGrid[hitRow][newCol] * 2.5);
        }
      }
      // Reducir probabilidad arriba y abajo (barco es horizontal)
      for (let dr = -1; dr <= 1; dr += 2) {
        const newRow = hitRow + dr;
        if (newRow >= 0 && newRow < GRID_SIZE && newGrid[newRow][hitCol] > 0) {
          newGrid[newRow][hitCol] *= 0.3;
        }
      }
    }

    if (isVertical) {
      // Aumentar probabilidad arriba y abajo
      for (let dr = -1; dr <= 1; dr += 2) {
        const newRow = hitRow + dr;
        if (newRow >= 0 && newRow < GRID_SIZE && newGrid[newRow][hitCol] > 0) {
          newGrid[newRow][hitCol] = Math.min(1, newGrid[newRow][hitCol] * 2.5);
        }
      }
      // Reducir probabilidad a izquierda y derecha (barco es vertical)
      for (let dc = -1; dc <= 1; dc += 2) {
        const newCol = hitCol + dc;
        if (newCol >= 0 && newCol < GRID_SIZE && newGrid[hitRow][newCol] > 0) {
          newGrid[hitRow][newCol] *= 0.3;
        }
      }
    }
  } else {
    // Primer hit de un barco, aumentar todas las celdas adyacentes
    const adjacentCells = [
      { row: hitRow - 1, col: hitCol },
      { row: hitRow + 1, col: hitCol },
      { row: hitRow, col: hitCol - 1 },
      { row: hitRow, col: hitCol + 1 },
    ];

    for (const cell of adjacentCells) {
      if (
        cell.row >= 0 &&
        cell.row < GRID_SIZE &&
        cell.col >= 0 &&
        cell.col < GRID_SIZE &&
        newGrid[cell.row][cell.col] > 0
      ) {
        newGrid[cell.row][cell.col] = Math.min(
          1,
          newGrid[cell.row][cell.col] * 2.0
        );
      }
    }
  }

  return normalizeGrid(newGrid);
}

/**
 * Actualización bayesiana después de un miss
 * Reduce probabilidad de celdas cercanas y recalcula basado en barcos restantes
 */
export function updateProbabilityAfterMiss(
  grid: number[][],
  missRow: number,
  missCol: number
): number[][] {
  const newGrid = grid.map((row) => [...row]);

  // La celda fallada tiene probabilidad 0
  newGrid[missRow][missCol] = 0;

  // Ligeramente reducir probabilidad de celdas adyacentes
  // (menos probable que un barco esté muy cerca de un miss)
  const adjacentCells = [
    { row: missRow - 1, col: missCol },
    { row: missRow + 1, col: missCol },
    { row: missRow, col: missCol - 1 },
    { row: missRow, col: missCol + 1 },
  ];

  for (const cell of adjacentCells) {
    if (
      cell.row >= 0 &&
      cell.row < GRID_SIZE &&
      cell.col >= 0 &&
      cell.col < GRID_SIZE &&
      newGrid[cell.row][cell.col] > 0
    ) {
      newGrid[cell.row][cell.col] *= 0.85;
    }
  }

  return normalizeGrid(newGrid);
}

/**
 * Genera el mapa de probabilidad completo basado en el estado del juego
 */
export function generateProbabilityMap(
  shots: Shot[],
  remainingShipSizes: number[] = SHIP_SIZES
): ProbabilityMap {
  // 1. Calcular probabilidad basada en posiciones válidas de barcos
  let grid = calculateShipPlacementProbability(shots, remainingShipSizes);

  // 2. Combinar con probabilidad inicial (centro > bordes)
  const initialGrid = generateInitialProbabilityMap();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      // 70% placement probability + 30% initial position weight
      grid[row][col] = grid[row][col] * 0.7 + initialGrid[row][col] * 0.3;
    }
  }

  // 3. Aplicar actualizaciones bayesianas para cada disparo
  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));

  for (const shot of shots) {
    // Marcar celdas disparadas como 0
    grid[shot.row][shot.col] = 0;

    if (shot.hit) {
      // Actualizar probabilidades basadas en hits
      const previousHits = shots.filter(
        (s) => s.hit && (s.row !== shot.row || s.col !== shot.col)
      );
      grid = updateProbabilityAfterHit(grid, shot.row, shot.col, previousHits);
    }
  }

  // 4. Boost para celdas adyacentes a hits no hundidos
  const activeHits = findActiveHits(shots);
  for (const hit of activeHits) {
    const adjacentCells = [
      { row: hit.row - 1, col: hit.col },
      { row: hit.row + 1, col: hit.col },
      { row: hit.row, col: hit.col - 1 },
      { row: hit.row, col: hit.col + 1 },
    ];

    for (const cell of adjacentCells) {
      if (
        cell.row >= 0 &&
        cell.row < GRID_SIZE &&
        cell.col >= 0 &&
        cell.col < GRID_SIZE &&
        !shotSet.has(`${cell.row},${cell.col}`)
      ) {
        grid[cell.row][cell.col] = Math.min(1, grid[cell.row][cell.col] * 1.8);
      }
    }
  }

  // 5. Normalizar y obtener top celdas
  grid = normalizeGrid(grid);

  const topCells = getTopCells(grid, shotSet);

  return { grid, topCells };
}

/**
 * Encuentra hits que probablemente pertenecen a barcos no hundidos
 */
function findActiveHits(shots: Shot[]): Shot[] {
  const hits = shots.filter((s) => s.hit);
  const shotSet = new Set(shots.map((s) => `${s.row},${s.col}`));

  // Un hit está "activo" si tiene al menos una celda adyacente sin disparar
  return hits.filter((hit) => {
    const adjacentCells = [
      { row: hit.row - 1, col: hit.col },
      { row: hit.row + 1, col: hit.col },
      { row: hit.row, col: hit.col - 1 },
      { row: hit.row, col: hit.col + 1 },
    ];

    return adjacentCells.some(
      (cell) =>
        cell.row >= 0 &&
        cell.row < GRID_SIZE &&
        cell.col >= 0 &&
        cell.col < GRID_SIZE &&
        !shotSet.has(`${cell.row},${cell.col}`)
    );
  });
}

/**
 * Obtiene las celdas con mayor probabilidad
 */
function getTopCells(
  grid: number[][],
  shotSet: Set<string>,
  count: number = 10
): { row: number; col: number; probability: number }[] {
  const cells: { row: number; col: number; probability: number }[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!shotSet.has(`${row},${col}`) && grid[row][col] > 0) {
        cells.push({ row, col, probability: grid[row][col] });
      }
    }
  }

  return cells.sort((a, b) => b.probability - a.probability).slice(0, count);
}

/**
 * Normaliza el grid para que los valores estén entre 0 y 1
 */
function normalizeGrid(grid: number[][]): number[][] {
  let maxVal = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] > maxVal) {
        maxVal = grid[row][col];
      }
    }
  }

  if (maxVal === 0) return grid;

  return grid.map((row) => row.map((val) => val / maxVal));
}

/**
 * Estima los tamaños de barcos restantes basado en hits y patrones
 */
export function estimateRemainingShips(shots: Shot[]): number[] {
  const hits = shots.filter((s) => s.hit);
  const hitCount = hits.length;

  // Lógica simplificada: estimar barcos hundidos por cantidad de hits
  // Cada barco tiene: 5, 4, 3, 3, 2 celdas = 17 total
  const remaining = [...SHIP_SIZES];

  // Encontrar clusters de hits (barcos potencialmente hundidos)
  const clusters = findHitClusters(hits);

  for (const cluster of clusters) {
    const size = cluster.length;
    // Si el cluster coincide con un tamaño de barco, podría estar hundido
    const matchingIndex = remaining.findIndex((s) => s === size);
    if (matchingIndex !== -1 && isClusterLikelySunk(cluster, shots)) {
      remaining.splice(matchingIndex, 1);
    }
  }

  return remaining;
}

/**
 * Encuentra clusters de hits conectados
 */
function findHitClusters(hits: Shot[]): Shot[][] {
  const visited = new Set<string>();
  const clusters: Shot[][] = [];

  for (const hit of hits) {
    const key = `${hit.row},${hit.col}`;
    if (visited.has(key)) continue;

    const cluster: Shot[] = [];
    const queue = [hit];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = `${current.row},${current.col}`;

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      cluster.push(current);

      // Buscar hits adyacentes
      for (const h of hits) {
        const hKey = `${h.row},${h.col}`;
        if (visited.has(hKey)) continue;

        if (
          (Math.abs(h.row - current.row) === 1 && h.col === current.col) ||
          (Math.abs(h.col - current.col) === 1 && h.row === current.row)
        ) {
          queue.push(h);
        }
      }
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Determina si un cluster de hits probablemente es un barco hundido
 */
function isClusterLikelySunk(cluster: Shot[], allShots: Shot[]): boolean {
  if (cluster.length < 2) return false;

  const shotSet = new Set(allShots.map((s) => `${s.row},${s.col}`));

  // Verificar si todos los extremos del cluster están rodeados por misses o bordes
  const isHorizontal = cluster.every((c) => c.row === cluster[0].row);
  const isVertical = cluster.every((c) => c.col === cluster[0].col);

  if (!isHorizontal && !isVertical) return false;

  if (isHorizontal) {
    const row = cluster[0].row;
    const cols = cluster.map((c) => c.col).sort((a, b) => a - b);
    const minCol = cols[0];
    const maxCol = cols[cols.length - 1];

    // Verificar extremos
    const leftBlocked =
      minCol === 0 ||
      (shotSet.has(`${row},${minCol - 1}`) &&
        !allShots.find((s) => s.row === row && s.col === minCol - 1)?.hit);
    const rightBlocked =
      maxCol === GRID_SIZE - 1 ||
      (shotSet.has(`${row},${maxCol + 1}`) &&
        !allShots.find((s) => s.row === row && s.col === maxCol + 1)?.hit);

    return leftBlocked && rightBlocked;
  }

  if (isVertical) {
    const col = cluster[0].col;
    const rows = cluster.map((c) => c.row).sort((a, b) => a - b);
    const minRow = rows[0];
    const maxRow = rows[rows.length - 1];

    const topBlocked =
      minRow === 0 ||
      (shotSet.has(`${minRow - 1},${col}`) &&
        !allShots.find((s) => s.row === minRow - 1 && s.col === col)?.hit);
    const bottomBlocked =
      maxRow === GRID_SIZE - 1 ||
      (shotSet.has(`${maxRow + 1},${col}`) &&
        !allShots.find((s) => s.row === maxRow + 1 && s.col === col)?.hit);

    return topBlocked && bottomBlocked;
  }

  return false;
}

/**
 * Combina probabilidades del motor bayesiano con Q-values
 */
export function combineWithQValues(
  probabilityMap: ProbabilityMap,
  qValues: Map<string, number>,
  probabilityWeight: number = 0.6
): { row: number; col: number; score: number }[] {
  const qWeight = 1 - probabilityWeight;
  const combined: { row: number; col: number; score: number }[] = [];

  for (const cell of probabilityMap.topCells) {
    const key = `${cell.row},${cell.col}`;
    const qValue = qValues.get(key) || 0;

    const score = cell.probability * probabilityWeight + qValue * qWeight;

    combined.push({
      row: cell.row,
      col: cell.col,
      score,
    });
  }

  return combined.sort((a, b) => b.score - a.score);
}
