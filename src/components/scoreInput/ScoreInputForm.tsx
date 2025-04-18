import { clsx } from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';

import { checkMinimumDrives } from '../../lib/scoreFormatters';
import { getPlayersForTeam, getTeamScores } from '../../lib/supabaseQueries';
import { useScoreSubmission } from '../../lib/useScoreSubmission';
import { TournamentType } from '../../types/supabase';

interface ScoreInputFormProps {
  teamId: string;
  tournamentType: TournamentType;
  minDrivesPerPlayer: number;
  coursePars?: { [key: string]: number };
  playerMap: Map<string, number>;
}

interface HoleScore {
  hole_number: number;
  strokes: number;
  drive_player_id: string;
  mulligan_player_id: string | null;
}

// Helper function to determine score class based on Tailwind - Adjusting colors
const getScoreTailwindClass = (score: number, par: number): string => {
  if (!score || !par || par === 0) return 'bg-white text-gray-700'; // Default
  const relativeScore = score - par;
  // Use dark green for Eagle, light red for Bogey, dark red for Dbl Bogey+
  if (relativeScore <= -2) return 'bg-green-700 text-white font-bold'; // Dark Green Eagle
  if (relativeScore === -1) return 'bg-green-100 text-green-800 font-semibold'; // Birdie (Keep light green)
  if (relativeScore === 0) return 'bg-gray-100 text-gray-700'; // Par
  if (relativeScore === 1) return 'bg-red-100 text-red-800'; // Light Red Bogey
  if (relativeScore >= 2) return 'bg-red-700 text-white font-bold'; // Dark Red Dbl Bogey+
  return 'bg-white text-gray-700';
};

// Helper function to determine player select background class - Using Yellow/Purple
const getPlayerSelectTailwindClass = (
  selectedPlayerId: string | null,
  playerMap: Map<string, number>,
): string => {
  if (!selectedPlayerId) return 'bg-gray-50 text-gray-700'; // Light gray default for selects
  const playerIndex = playerMap.get(selectedPlayerId);
  // Use Yellow for P1, Purple for P2
  if (playerIndex === 0) return 'bg-yellow-50 text-gray-800 font-medium'; // Player 1 (Yellow)
  if (playerIndex === 1) return 'bg-purple-100 text-gray-800 font-medium'; // Player 2 (Purple)
  // Keep others subtle if they exist (for 4-man)
  if (playerIndex === 2) return 'bg-blue-50 text-gray-800 font-medium';
  if (playerIndex === 3) return 'bg-green-50 text-gray-800 font-medium';
  return 'bg-gray-50 text-gray-700'; // Default background
};

const ScoreInputForm: React.FC<ScoreInputFormProps> = ({
  teamId,
  tournamentType,
  minDrivesPerPlayer = 5,
  coursePars = {},
  playerMap,
}) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState<HoleScore[]>([]);
  const [driveCounts, setDriveCounts] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savingHole, setSavingHole] = useState<number | null>(null);
  const {
    submitSingleScore,
    isSubmitting,
    error: submissionError,
    isSuccess,
    clearError,
  } = useScoreSubmission();

  // Initialize/load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch players for the team
        const playersData = await getPlayersForTeam(teamId);
        setPlayers(playersData);

        // Fetch existing scores
        const scoresData = await getTeamScores(teamId);

        // Initialize score state for all 18 holes or use existing scores
        const initialScores: HoleScore[] = [];
        const drivesCount: Record<string, number> = {};

        // Initialize all players with 0 drives
        playersData.forEach((player) => {
          drivesCount[player.id] = 0;
        });

        // Map existing scores and count drives
        for (let i = 1; i <= 18; i++) {
          const existingScore = scoresData.find((s) => s.hole_number === i);

          if (existingScore) {
            initialScores.push({
              hole_number: i,
              strokes: existingScore.strokes,
              drive_player_id: existingScore.drive_player_id,
              mulligan_player_id: existingScore.mulligan_player_id,
            });

            // Count this drive
            if (drivesCount[existingScore.drive_player_id] !== undefined) {
              drivesCount[existingScore.drive_player_id]++;
            }
          } else {
            // Default empty score
            initialScores.push({
              hole_number: i,
              strokes: 0,
              drive_player_id: '',
              mulligan_player_id: null,
            });
          }
        }

        setScores(initialScores);
        setDriveCounts(drivesCount);
      } catch (error) {
        console.error('Error loading score input data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  // Debounce function
  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced save function
  const debouncedSaveScore = useCallback(
    debounce((score: HoleScore) => {
      saveScore(score);
    }, 1000), // 1000ms delay
    [teamId, tournamentType], // Dependencies for saveScore need to be stable or included
  );

  // Auto-save the score when it changes
  const saveScore = async (score: HoleScore) => {
    // Validate the score before submitting
    if (score.strokes > 0 && score.drive_player_id) {
      setSavingHole(score.hole_number);
      setFormError(null);

      console.log(`Saving score for hole ${score.hole_number}:`, score);

      try {
        const result = await submitSingleScore({
          team_id: teamId,
          tournament_type: tournamentType,
          hole_number: score.hole_number,
          strokes: score.strokes,
          drive_player_id: score.drive_player_id,
          mulligan_player_id: score.mulligan_player_id,
        });

        console.log(
          `Score submission result for hole ${score.hole_number}:`,
          result,
        );

        if (!result.success) {
          // Check for row-level security policy errors related to mulligans
          if (
            result.error &&
            result.error.includes('row-level security policy')
          ) {
            console.error('Row-level security error:', result.error);

            // Handle mulligan permission error
            if (score.mulligan_player_id) {
              // Try again without the mulligan
              console.log(
                `Retrying hole ${score.hole_number} without mulligan`,
              );
              const retryResult = await submitSingleScore({
                team_id: teamId,
                tournament_type: tournamentType,
                hole_number: score.hole_number,
                strokes: score.strokes,
                drive_player_id: score.drive_player_id,
                mulligan_player_id: null, // Remove mulligan
              });

              console.log(
                `Retry result for hole ${score.hole_number}:`,
                retryResult,
              );

              if (retryResult.success) {
                // Update the UI to show the score was saved without mulligan
                setFormError(
                  'Mulligan not allowed due to permissions. Score saved without mulligan.',
                );

                // Reset the mulligan selection for this hole
                setScores((prevScores) => {
                  return prevScores.map((s) => {
                    if (s.hole_number === score.hole_number) {
                      return { ...s, mulligan_player_id: null };
                    }
                    return s;
                  });
                });
              } else {
                // There's a different issue
                setFormError(`Error saving score: ${retryResult.error}`);
              }
            } else {
              setFormError(`Permission denied: ${result.error}`);
            }
          } else if (result.error) {
            setFormError(result.error);
          } else {
            console.log(
              `Successfully saved score for hole ${score.hole_number}`,
            );
          }
        }
      } catch (error) {
        console.error('Error saving score:', error);
        setFormError('Failed to save score. Please try again.');
      } finally {
        setSavingHole(null);
      }
    }
  };

  // Update a score for a specific hole
  const updateScore = (
    holeNumber: number,
    field: keyof HoleScore,
    value: any,
  ) => {
    setScores((prevScores) => {
      const newScores = [...prevScores];
      const index = newScores.findIndex((s) => s.hole_number === holeNumber);

      if (index !== -1) {
        // Get the previous state of the score being updated
        const previousScore = prevScores[index];

        // Update the field
        const updatedScore = { ...newScores[index], [field]: value };
        newScores[index] = updatedScore;

        // If updating drive player, recalculate drive counts immediately
        if (field === 'drive_player_id') {
          const newDriveCounts: Record<string, number> = {};
          // Initialize counts
          players.forEach((player) => {
            newDriveCounts[player.id] = 0;
          });
          // Recalculate based on all updated scores in this batch
          newScores.forEach((s) => {
            if (
              s.drive_player_id &&
              newDriveCounts[s.drive_player_id] !== undefined
            ) {
              newDriveCounts[s.drive_player_id]++;
            }
          });
          setDriveCounts(newDriveCounts); // Update state
        }

        // Immediately set saving state for select changes to provide instant feedback
        // The actual save is still debounced
        if (field === 'drive_player_id' || field === 'mulligan_player_id') {
          // Only set if the value actually changed
          if (previousScore[field] !== value) {
            setSavingHole(holeNumber);
            // Clear error instantly when user makes a valid selection change
            if (field === 'drive_player_id' && value) setFormError(null);
          }
        }

        // Trigger debounced save only if strokes or drive_player_id are valid
        // Only save if the value actually changed to avoid redundant saves
        if (
          updatedScore.strokes > 0 &&
          updatedScore.drive_player_id &&
          (field !== 'mulligan_player_id' ||
            previousScore.mulligan_player_id !== value) && // Only save if mulligan changed
          (field !== 'strokes' || previousScore.strokes !== value) && // Only save if strokes changed
          (field !== 'drive_player_id' ||
            previousScore.drive_player_id !== value) // Only save if drive player changed
        ) {
          debouncedSaveScore(updatedScore);
        }
      }
      return newScores;
    });
  };

  // Check drive requirements
  const checkDriveRequirements = () => {
    const countsArray = players.map((player) => ({
      id: player.id,
      name: player.initial, // Or player.name if you prefer
      count: driveCounts[player.id] || 0,
    }));
    return checkMinimumDrives(countsArray, minDrivesPerPlayer);
  };

  // Render loading state
  if (isLoading) {
    return <div className='text-center p-4'>Loading score input...</div>;
  }

  // Calculate total score and relative to par
  const totalStrokes = scores.reduce((acc, score) => acc + score.strokes, 0);
  const totalPar = Object.values(coursePars).reduce((acc, par) => acc + par, 0);
  const relativeToPar = totalStrokes > 0 ? totalStrokes - totalPar : 0; // Only calculate if scores exist

  const driveReqsMet = checkDriveRequirements();

  return (
    <div className='score-input-container p-2 sm:p-4 bg-white rounded-lg shadow-md'>
      <h3 className='text-xl font-semibold mb-4 text-gray-800'>Enter Scores</h3>
      {/* Display Team Info */}
      {/* You might want to fetch and display team name here */}

      {/* Form Error Messages */}
      {formError && (
        <div className='my-2 p-2 bg-red-100 text-red-700 rounded text-sm'>
          {formError}
        </div>
      )}
      {submissionError && (
        <div className='my-2 p-2 bg-red-100 text-red-700 rounded text-sm'>
          Submission Error: {submissionError}
        </div>
      )}

      {/* Score Input Table */}
      <div className='overflow-x-auto'>
        {/* Remove all borders, rely on spacing/backgrounds */}
        <table className='min-w-full'>
          {/* Table Header: Remove borders, adjust padding */}
          <thead className='bg-gray-50'>
            <tr>
              <th className='pl-1 pr-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Hole
              </th>
              <th className='px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10'>
                Par
              </th>
              <th className='px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16'>
                Score
              </th>
              <th className='px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Drive
              </th>
              {tournamentType === '2-man' && (
                <th className='pl-1 pr-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Mulley {/* Renamed Header */}
                </th>
              )}
            </tr>
          </thead>
          {/* Table Body: Remove borders, add subtle bottom margin/padding to rows for separation? Or rely on alternating backgrounds? Let's stick to no lines for now. */}
          <tbody className='bg-white'>
            {scores.map((score, index) => {
              // Add index for alternating backgrounds
              const par = coursePars[score.hole_number] || 0;
              const scoreInputClass = getScoreTailwindClass(score.strokes, par);
              const driveSelectClass = getPlayerSelectTailwindClass(
                score.drive_player_id,
                playerMap,
              );
              const mulliganSelectClass = getPlayerSelectTailwindClass(
                score.mulligan_player_id,
                playerMap,
              );

              return (
                // Add subtle alternating row background instead of borders
                <tr
                  key={score.hole_number}
                  className={clsx(index % 2 === 0 ? 'bg-white' : 'bg-gray-50', {
                    'opacity-50 pointer-events-none':
                      savingHole === score.hole_number,
                  })}
                >
                  {/* Cells: Remove borders, reduce horizontal padding */}
                  <td className='pl-1 pr-1 py-2 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {score.hole_number}
                  </td>
                  <td className='px-1 py-2 whitespace-nowrap text-sm text-center text-gray-600 w-10'>
                    {par || '-'}
                  </td>
                  <td className='px-0.5 py-1 whitespace-nowrap w-16'>
                    {/* Minimal horizontal padding */}
                    <input
                      type='number'
                      min='1'
                      max='15'
                      value={score.strokes > 0 ? score.strokes : ''}
                      onChange={(e) =>
                        updateScore(
                          score.hole_number,
                          'strokes',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className={clsx(
                        'w-full p-2 text-center border border-transparent rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-colors duration-150',
                        scoreInputClass, // Dynamic background/text
                      )}
                      placeholder='-'
                      disabled={savingHole === score.hole_number}
                    />
                  </td>
                  <td className='px-0.5 py-1 whitespace-nowrap'>
                    {' '}
                    {/* Minimal horizontal padding */}
                    {/* Drive Select: More subtle border */}
                    <select
                      value={score.drive_player_id}
                      onChange={(e) =>
                        updateScore(
                          score.hole_number,
                          'drive_player_id',
                          e.target.value,
                        )
                      }
                      className={clsx(
                        'w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-colors duration-150 appearance-none',
                        driveSelectClass, // Dynamic background
                      )}
                      disabled={savingHole === score.hole_number}
                    >
                      <option value=''>Select</option>{' '}
                      {/* Changed default text */}
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.initial || player.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {tournamentType === '2-man' && (
                    <td className='px-0.5 py-1 whitespace-nowrap'>
                      {' '}
                      {/* Minimal horizontal padding */}
                      {/* Mulligan Select: More subtle border */}
                      <select
                        value={score.mulligan_player_id || ''}
                        onChange={(e) =>
                          updateScore(
                            score.hole_number,
                            'mulligan_player_id',
                            e.target.value || null,
                          )
                        }
                        className={clsx(
                          'w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-colors duration-150 appearance-none',
                          mulliganSelectClass, // Dynamic background
                        )}
                        disabled={savingHole === score.hole_number}
                      >
                        <option value=''>None</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.initial || player.name} {/* REMOVED Use */}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreInputForm;
