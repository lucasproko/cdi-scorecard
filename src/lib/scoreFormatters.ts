/**
 * Formats a relative to par score with the proper sign or 'E' for even
 * @param relativeToPar The score relative to par
 * @returns A string representing the score (e.g., '+2', '-3', 'E')
 */
export function formatRelativeToPar(relativeToPar: number): string {
  if (relativeToPar === 0) {
    return 'E';
  } else if (relativeToPar > 0) {
    return `+${relativeToPar}`;
  } else {
    return `${relativeToPar}`;
  }
}

/**
 * Formats a relative to par score with proper CSS classes for styling
 * @param relativeToPar The score relative to par
 * @returns CSS classes for coloring the score
 */
export function getScoreColorClass(relativeToPar: number): string {
  if (relativeToPar < 0) {
    return 'text-green-500'; // Under par (good)
  } else if (relativeToPar > 0) {
    return 'text-red-500'; // Over par (bad)
  } else {
    return 'text-gray-700'; // Even par (neutral)
  }
}

/**
 * Formats the 'thru' display for completed holes
 * @param holesCompleted Number of holes completed
 * @returns A string showing either the hole number or 'F' for finished
 */
export function formatThru(holesCompleted: number): string {
  if (holesCompleted === 18) {
    return 'F';
  } else {
    return holesCompleted.toString();
  }
}

/**
 * Calculates if minimum drive requirements are met
 * @param driveCounts Array of drive counts per player
 * @param minDrives The minimum number of drives required per player
 * @returns True if requirements are met, false otherwise
 */
export function checkMinimumDrives(
  driveCounts: Array<{ id: string; name: string; count: number }>,
  minDrives = 5, // Default to 5 for 2-man scramble
): boolean {
  return driveCounts.every((player) => player.count >= minDrives);
}
