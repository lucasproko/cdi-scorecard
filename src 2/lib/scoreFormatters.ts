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

/**
 * Returns detailed Tailwind CSS classes for styling a score based on its relation to par.
 * Provides background, text color, and font weight.
 * @param score The actual score (strokes)
 * @param par The par for the hole
 * @returns Tailwind CSS class string
 */
export function getDetailedScoreStyling(
  score: number | null | undefined,
  par: number | null | undefined,
): string {
  if (
    score === null ||
    score === undefined ||
    par === null ||
    par === undefined ||
    score <= 0 ||
    par <= 0
  ) {
    return 'bg-white text-gray-400'; // Default for empty/invalid scores
  }
  const relativeScore = score - par;

  if (relativeScore <= -2) return 'bg-green-700 text-white font-bold'; // Dark Green Eagle/Albatross
  if (relativeScore === -1) return 'bg-green-100 text-green-800 font-semibold'; // Light Green Birdie
  if (relativeScore === 0) return 'bg-gray-100 text-gray-700'; // Gray Par
  if (relativeScore === 1) return 'bg-red-100 text-red-800'; // Light Red Bogey
  if (relativeScore >= 2) return 'bg-red-700 text-white font-bold'; // Dark Red Dbl Bogey+

  return 'bg-white text-gray-700'; // Fallback default
}
