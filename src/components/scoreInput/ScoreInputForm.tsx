import React, { useEffect, useState } from 'react';

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

// Helper function to determine score class
const getScoreClass = (score: number, par: number): string => {
  if (!score || !par || par === 0) return ''; // Avoid division by zero or styling without par
  const relativeScore = score - par;
  if (relativeScore <= -2) return 'score-eagle';
  if (relativeScore === -1) return 'score-birdie';
  if (relativeScore === 0) return 'score-equal-par';
  if (relativeScore === 1) return 'score-bogey';
  if (relativeScore >= 2) return 'score-double-bogey-plus';
  return '';
};

// Helper function to determine player select class
const getPlayerSelectClass = (
  selectedPlayerId: string | null,
  playerMap: Map<string, number>,
): string => {
  if (!selectedPlayerId) return '';
  const playerIndex = playerMap.get(selectedPlayerId);
  if (playerIndex === 0) return 'player1-selected';
  if (playerIndex === 1) return 'player2-selected';
  return '';
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
        // Update the field
        const updatedScore = { ...newScores[index], [field]: value };
        newScores[index] = updatedScore;

        // If updating drive player, recalculate drive counts
        if (field === 'drive_player_id') {
          const newDriveCounts = { ...driveCounts };

          // Decrement old drive player count if it exists
          const oldDriverId = prevScores[index].drive_player_id;
          if (oldDriverId && newDriveCounts[oldDriverId] !== undefined) {
            newDriveCounts[oldDriverId] = Math.max(
              0,
              newDriveCounts[oldDriverId] - 1,
            );
          }

          // Increment new drive player count
          if (value && newDriveCounts[value] !== undefined) {
            newDriveCounts[value]++;
          }

          setDriveCounts(newDriveCounts);
        }

        // Auto-save the score if it has all required fields
        if (
          updatedScore.strokes > 0 &&
          updatedScore.drive_player_id !== '' &&
          updatedScore.drive_player_id !== undefined
        ) {
          // Use setTimeout to debounce multiple rapid changes
          setTimeout(() => {
            saveScore(updatedScore);
          }, 500);
        }
      }

      return newScores;
    });
  };

  // Check drive requirements whenever they change
  useEffect(() => {
    // Define checkDriveRequirements INSIDE the effect
    const checkDriveRequirements = () => {
      const driversList = Object.entries(driveCounts).map(([id, count]) => ({
        id,
        name: players.find((p) => p.id === id)?.name || id,
        count,
      }));

      const drivesRequirementMet = checkMinimumDrives(
        driversList,
        minDrivesPerPlayer,
      );

      if (!drivesRequirementMet) {
        setFormError(
          `Some players have fewer than ${minDrivesPerPlayer} drives, which is the minimum requirement.`,
        );
      } else {
        // Only clear the specific drive error, leave other errors
        if (formError?.includes('drives, which is the minimum requirement')) {
          setFormError(null);
        }
      }
    };

    const filledHoles = scores.filter(
      (s) =>
        s.strokes > 0 &&
        s.drive_player_id !== '' &&
        s.drive_player_id !== undefined,
    ).length;

    // Only run the check when at least 9 holes are filled
    if (filledHoles >= 9) {
      checkDriveRequirements();
    }
    // Dependencies are now based on the values USED inside the effect and checkDriveRequirements
  }, [driveCounts, players, minDrivesPerPlayer, scores, formError]); // Removed checkDriveRequirements, added formError (used in checkDriveRequirements)

  if (isLoading) {
    return <div className='py-4 text-center'>Loading...</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Error message - Modified condition to exclude drive count warning */}
      {(formError || submissionError) &&
        !formError?.includes('drives, which is the minimum requirement') && (
          <div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
            <strong className='font-bold'>Warning:</strong>
            <span className='block sm:inline'>
              {formError?.includes('mulligan') ||
              submissionError?.includes('mulligan')
                ? 'Mulligan feature is not available or you do not have permission to use it. Your score has been saved without the mulligan.'
                : formError || submissionError}
            </span>
            <button
              className='absolute top-0 bottom-0 right-0 px-4 py-3'
              onClick={() => {
                setFormError(null);
                clearError();
              }}
            >
              <span className='text-2xl'>&times;</span>
            </button>
          </div>
        )}

      {/* Player drive counts */}
      <div
        className='bg-gray-50 p-4 rounded-lg shadow-sm'
        data-testid='drive-counts-section'
      >
        <h3 className='text-lg font-medium mb-3'>Drive Counts</h3>
        <div className='grid grid-cols-2 gap-4'>
          {players.map((player) => (
            <div key={player.id} className='flex justify-between'>
              <span>{player.name}:</span>
              <span
                className={
                  driveCounts[player.id] < minDrivesPerPlayer
                    ? 'text-red-500 font-bold'
                    : ''
                }
              >
                {driveCounts[player.id] || 0} drives
                {driveCounts[player.id] < minDrivesPerPlayer &&
                  ` (min: ${minDrivesPerPlayer})`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='space-y-8'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Hole
                </th>
                <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Par
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Strokes
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Drive
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Mulligan
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {scores.map((score) => {
                // Get Par for the current hole
                const parForHole =
                  coursePars[score.hole_number.toString()] || '-';
                const par = parseInt(parForHole.toString(), 10);

                // Determine dynamic classes using helpers
                const scoreClass = getScoreClass(score.strokes, par);
                const driveClass = getPlayerSelectClass(
                  score.drive_player_id,
                  playerMap,
                );
                const mulliganClass = getPlayerSelectClass(
                  score.mulligan_player_id,
                  playerMap,
                );

                return (
                  <tr key={score.hole_number}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {score.hole_number}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500'>
                      {parForHole}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <input
                        type='number'
                        min='1'
                        max='15'
                        value={score.strokes || ''}
                        onChange={(e) =>
                          updateScore(
                            score.hole_number,
                            'strokes',
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${scoreClass}`}
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <select
                        value={score.drive_player_id || ''}
                        onChange={(e) =>
                          updateScore(
                            score.hole_number,
                            'drive_player_id',
                            e.target.value,
                          )
                        }
                        className={`mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${driveClass}`}
                      >
                        <option value=''>Select player</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <select
                        value={score.mulligan_player_id || ''}
                        onChange={(e) =>
                          updateScore(
                            score.hole_number,
                            'mulligan_player_id',
                            e.target.value === '' ? null : e.target.value,
                          )
                        }
                        className={`mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${mulliganClass}`}
                      >
                        <option value=''>None</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {savingHole === score.hole_number ? (
                        <span className='text-blue-500 flex items-center'>
                          <svg
                            className='animate-spin -ml-1 mr-2 h-4 w-4'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        <>
                          {score.strokes > 0 && score.drive_player_id ? (
                            <span className='text-green-500'>Saved</span>
                          ) : (
                            <span className='text-gray-300'>Not saved</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScoreInputForm;
