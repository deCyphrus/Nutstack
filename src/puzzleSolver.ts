// ============================================================
// SECTION: PUZZLE SOLVER
// BFS-based solver that validates solvability and calculates
// minimum move count for a given bolt configuration.
// ============================================================

export interface Nut {
  id: string;
  revealed: boolean;
}

export interface Bolt {
  nuts: Nut[];
  isRevealPeg: boolean;
}

export interface PuzzleState {
  bolts: Bolt[];
  capacity: number;
}

interface StateNode {
  state: string;
  moves: number;
  parent: StateNode | null;
}

/**
 * Serializes a bolt configuration to a unique string for state comparison.
 * Only uses nut IDs (not revealed status) since game rules don't depend on revelation.
 */
function serializeState(bolts: Bolt[]): string {
  return bolts
    .map((bolt) => bolt.nuts.map((nut) => nut.id).join(','))
    .join('|');
}

/**
 * Deserializes a state string back into bolt arrays.
 * Creates all nuts with revealed=true (revelation state doesn't affect solvability).
 */
function deserializeState(
  stateStr: string
): Bolt[] {
  return stateStr.split('|').map((boltStr) => ({
    nuts: boltStr === '' ? [] : boltStr.split(',').map((id) => ({ id, revealed: true })),
    isRevealPeg: false,
  }));
}

/**
 * Checks if a bolt is fully sorted (all nuts same color, at full capacity).
 */
function isBoltLocked(bolt: Bolt, capacity: number): boolean {
  if (bolt.nuts.length !== capacity) return false;
  return bolt.nuts.every((n) => n.id === bolt.nuts[0].id);
}

/**
 * Checks if the entire puzzle is solved (all active bolts locked, empties empty).
 */
function isSolved(bolts: Bolt[], capacity: number): boolean {
  return bolts.every((b) => b.nuts.length === 0 || isBoltLocked(b, capacity));
}

/**
 * Gets the count of matching nuts at the top of a bolt.
 * E.g., if top 3 nuts are red and the 4th is blue, returns 3.
 */
function getTopRunCount(bolt: Bolt): number {
  if (bolt.nuts.length === 0) return 0;
  const topId = bolt.nuts[bolt.nuts.length - 1].id;
  let count = 1;
  for (let i = bolt.nuts.length - 2; i >= 0; i--) {
    if (bolt.nuts[i].id === topId) count++;
    else break;
  }
  return count;
}

/**
 * Generates all legal next states from the current state.
 * Each state represents a move: selecting a source bolt and moving nuts to a target bolt.
 */
function getNextStates(
  bolts: Bolt[],
  capacity: number
): Bolt[][] {
  const nextStates: Bolt[][] = [];

  // Try every source bolt
  for (let srcIdx = 0; srcIdx < bolts.length; srcIdx++) {
    const srcBolt = bolts[srcIdx];

    // Skip if empty or fully locked
    if (srcBolt.nuts.length === 0 || isBoltLocked(srcBolt, capacity)) {
      continue;
    }

    const topRunCount = getTopRunCount(srcBolt);
    if (topRunCount === 0) continue;

    const topNutId = srcBolt.nuts[srcBolt.nuts.length - 1].id;

    // Try every target bolt
    for (let tgtIdx = 0; tgtIdx < bolts.length; tgtIdx++) {
      if (srcIdx === tgtIdx) continue;

      const tgtBolt = bolts[tgtIdx];

      // Target must not be full and not locked
      if (tgtBolt.nuts.length >= capacity || isBoltLocked(tgtBolt, capacity)) {
        continue;
      }

      // If target has nuts, they must match the source top nut's color
      if (tgtBolt.nuts.length > 0 && tgtBolt.nuts[tgtBolt.nuts.length - 1].id !== topNutId) {
        continue;
      }

      // Calculate how many nuts we can move
      const availableSpace = capacity - tgtBolt.nuts.length;
      const moveCount = Math.min(topRunCount, availableSpace);

      if (moveCount <= 0) continue;

      // Create the new state
      const newBolts = bolts.map((b) => ({ ...b, nuts: [...b.nuts] }));

      // Move the nuts
      const nutsToMove = newBolts[srcIdx].nuts.splice(
        newBolts[srcIdx].nuts.length - moveCount,
        moveCount
      );
      newBolts[tgtIdx].nuts.push(...nutsToMove);

      nextStates.push(newBolts);
    }
  }

  return nextStates;
}

/**
 * Main solver: uses BFS to find the shortest path from initial state to solved state.
 * Returns the minimum number of moves, or -1 if unsolvable.
 *
 * WARNING: This can be slow for large puzzles (high bolt count, high capacity).
 * For most game puzzles (8-10 bolts, capacity 3-8), it should complete in <100ms.
 */
export function solvePuzzle(
  initialBolts: Bolt[],
  capacity: number,
  maxMovesToCheck: number = 100
): { solvable: boolean; minMoves: number } {
  // Quick check: already solved?
  if (isSolved(initialBolts, capacity)) {
    return { solvable: true, minMoves: 0 };
  }

  const startState = serializeState(initialBolts);
  const queue: StateNode[] = [
    { state: startState, moves: 0, parent: null },
  ];
  const visited = new Set<string>([startState]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Exceeded max moves: puzzle is "unsolvable within reasonable bounds"
    if (current.moves >= maxMovesToCheck) {
      break;
    }

    // Generate next states
    const currentBolts = deserializeState(current.state);
    const nextStates = getNextStates(currentBolts, capacity);

    for (const nextBolts of nextStates) {
      // Check if this is the solved state
      if (isSolved(nextBolts, capacity)) {
        return { solvable: true, minMoves: current.moves + 1 };
      }

      const nextStateStr = serializeState(nextBolts);
      if (!visited.has(nextStateStr)) {
        visited.add(nextStateStr);
        queue.push({
          state: nextStateStr,
          moves: current.moves + 1,
          parent: current,
        });
      }
    }
  }

  return { solvable: false, minMoves: -1 };
}

/**
 * Validates that a puzzle is solvable and returns its minimum move count.
 * This is the main entry point for the game.
 */
export function validateAndSolvePuzzle(
  bolts: Bolt[],
  capacity: number
): { valid: boolean; minMoves: number } {
  const result = solvePuzzle(bolts, capacity, 100);
  if (!result.solvable) {
    return { valid: false, minMoves: -1 };
  }
  return { valid: true, minMoves: result.minMoves };
}

// ============================================================
// END SECTION: PUZZLE SOLVER
// ============================================================
