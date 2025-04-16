import React, { useEffect, useState } from 'react';

interface Player {
  id: number;
  name: string;
  mulligansLeft: number;
}
interface Hole {
  number: number;
  par: number;
}
interface CourseData {
  holes: Hole[];
}
interface TeamData {
  id: number;
  name: string;
  players: Player[];
}
interface HoleScore {
  hole: number;
  strokes: number | null;
  drive: number | null; // player id
  mulligan: number | null; // player id
}

// Define the type for the submitted score data
export interface SubmittedScoreData {
  teamId: number;
  scores: HoleScore[];
  driveCounts: Record<number, number>;
  mulliganCounts: Record<number, number>;
}

interface ScoreInputFormProps {
  courseData: CourseData;
  teamData: TeamData;
  onSubmit: (scoreData: SubmittedScoreData) => void; // Use the defined type
}
export function ScoreInputForm({
  courseData,
  teamData,
  onSubmit,
}: ScoreInputFormProps) {
  // Initialize scores for all holes
  const initialScores = courseData.holes.map((hole) => ({
    hole: hole.number,
    strokes: null,
    drive: null,
    mulligan: null,
  }));
  const [scores, setScores] = useState<HoleScore[]>(initialScores);
  const [driveCounts, setDriveCounts] = useState<Record<number, number>>({});
  const [mulliganCounts, setMulliganCounts] = useState<Record<number, number>>(
    {},
  );
  // Initialize drive and mulligan counts
  useEffect(() => {
    const drives: Record<number, number> = {}; // Add explicit type
    const mulligans: Record<number, number> = {}; // Add explicit type
    teamData.players.forEach((player) => {
      drives[player.id] = 0;
      mulligans[player.id] = player.mulligansLeft;
    });
    setDriveCounts(drives);
    setMulliganCounts(mulligans);
  }, [teamData]);
  // Auto-submit effect when scores change
  useEffect(() => {
    // Check if all holes have strokes and drive selected
    const incompleteHoles = scores.filter(
      (score) => score.strokes === null || score.drive === null,
    );
    // Don't auto-submit if there are incomplete holes
    if (incompleteHoles.length > 0) {
      return;
    }
    // Check minimum drive counts
    const minDriveCount = 5;
    const insufficientDrives = Object.entries(driveCounts).filter(
      ([_, count]) => count < minDriveCount,
    );
    // Don't auto-submit if drive requirements aren't met
    if (insufficientDrives.length > 0) {
      return;
    }
    // Auto-submit if all validations pass
    onSubmit({
      teamId: teamData.id,
      scores,
      driveCounts,
      mulliganCounts,
    });
  }, [scores, driveCounts, mulliganCounts, onSubmit, teamData.id]); // Add missing dependencies
  // Update a hole's score
  const updateHoleScore = (
    holeNumber: number,
    field: string,
    value: number | null,
  ) => {
    setScores((prevScores) => {
      return prevScores.map((score) => {
        if (score.hole === holeNumber) {
          // If changing drive selection, update drive counts
          if (field === 'drive') {
            // Decrement previous drive count if it exists
            if (score.drive !== null) {
              setDriveCounts((prev) => ({
                ...prev,
                [score.drive as number]: prev[score.drive as number] - 1, // Add null check/assertion
              }));
            }
            // Increment new drive count if it exists
            if (value !== null) {
              setDriveCounts((prev) => ({
                ...prev,
                [value]: prev[value] + 1, // `value` is checked for null
              }));
            }
          }
          // If changing mulligan selection, update mulligan counts
          if (field === 'mulligan') {
            // If removing a mulligan, return it to the player
            if (score.mulligan !== null && value === null) {
              setMulliganCounts((prev) => ({
                ...prev,
                [score.mulligan as number]: prev[score.mulligan as number] + 1, // Add null check/assertion
              }));
            }
            // If adding a new mulligan, deduct it from the player
            if (value !== null && score.mulligan !== value) {
              // Return the previous mulligan if there was one
              if (score.mulligan !== null) {
                setMulliganCounts((prev) => ({
                  ...prev,
                  [score.mulligan as number]:
                    prev[score.mulligan as number] + 1, // Add null check/assertion
                }));
              }
              // Deduct the new mulligan
              setMulliganCounts((prev) => ({
                ...prev,
                [value]: prev[value] - 1, // `value` is checked for null
              }));
            }
          }
          return {
            ...score,
            [field]: value,
          };
        }
        return score;
      });
    });
  };
  // Group holes into front 9 and back 9
  const frontNine = courseData.holes.slice(0, 9);
  const backNine = courseData.holes.slice(9, 18);
  return (
    <div className='max-w-full mx-auto'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden mb-8'>
        <div className='bg-[#0B3D2E] text-white px-6 py-4 flex justify-between items-center'>
          <h2 className='text-xl font-bold'>{teamData.name}</h2>
          <div className='flex space-x-6'>
            {teamData.players.map((player) => (
              <div key={player.id} className='text-sm'>
                <span className='font-medium'>{player.name}:</span>{' '}
                <span>{mulliganCounts[player.id] || 0} mulligans left</span>
              </div>
            ))}
          </div>
        </div>
        <div className='p-6'>
          {/* Drive summary */}
          <div className='mb-6 bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium mb-2'>Drive Count</h3>
            <div className='flex justify-between'>
              {teamData.players.map((player) => (
                <div key={player.id}>
                  <span className='font-medium'>{player.name}:</span>{' '}
                  <span
                    className={
                      driveCounts[player.id] < 5 ? 'text-red-500 font-bold' : ''
                    }
                  >
                    {driveCounts[player.id] || 0}/18
                  </span>
                </div>
              ))}
            </div>
            <div className='text-sm text-gray-500 mt-2'>
              Each player must use their drive at least 5 times
            </div>
          </div>
          {/* Front Nine */}
          <div className='mb-10'>
            <h3 className='font-bold mb-3 text-lg'>Front Nine</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Hole
                    </th>
                    {frontNine.map((hole) => (
                      <th
                        key={hole.number}
                        className='px-3 py-2 text-center font-medium text-gray-700 min-w-[60px]'
                      >
                        {hole.number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Par Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Par
                    </td>
                    {frontNine.map((hole) => (
                      <td key={hole.number} className='px-3 py-2 text-center'>
                        {hole.par}
                      </td>
                    ))}
                  </tr>
                  {/* Score Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Score
                    </td>
                    {frontNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <input
                            type='number'
                            min='1'
                            max='12'
                            value={
                              score?.strokes === null ? '' : score?.strokes
                            }
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'strokes',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                          />
                        </td>
                      );
                    })}
                  </tr>
                  {/* Drive Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Drive
                    </td>
                    {frontNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <select
                            value={score?.drive || ''}
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'drive',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                          >
                            <option value=''>-</option>
                            {teamData.players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name.substring(0, 2)}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Mulligan Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Mulligan
                    </td>
                    {frontNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <select
                            value={score?.mulligan || ''}
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'mulligan',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            disabled={teamData.players.every(
                              (p) =>
                                mulliganCounts[p.id] <= 0 &&
                                score?.mulligan !== p.id,
                            )}
                          >
                            <option value=''>-</option>
                            {teamData.players.map((player) => (
                              <option
                                key={player.id}
                                value={player.id}
                                disabled={
                                  mulliganCounts[player.id] <= 0 &&
                                  score?.mulligan !== player.id
                                }
                              >
                                {player.name.substring(0, 2)} (
                                {mulliganCounts[player.id]})
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Back Nine */}
          <div className='mb-6'>
            <h3 className='font-bold mb-3 text-lg'>Back Nine</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Hole
                    </th>
                    {backNine.map((hole) => (
                      <th
                        key={hole.number}
                        className='px-3 py-2 text-center font-medium text-gray-700 min-w-[60px]'
                      >
                        {hole.number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Par Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Par
                    </td>
                    {backNine.map((hole) => (
                      <td key={hole.number} className='px-3 py-2 text-center'>
                        {hole.par}
                      </td>
                    ))}
                  </tr>
                  {/* Score Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Score
                    </td>
                    {backNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <input
                            type='number'
                            min='1'
                            max='12'
                            value={
                              score?.strokes === null ? '' : score?.strokes
                            }
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'strokes',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                          />
                        </td>
                      );
                    })}
                  </tr>
                  {/* Drive Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Drive
                    </td>
                    {backNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <select
                            value={score?.drive || ''}
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'drive',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                          >
                            <option value=''>-</option>
                            {teamData.players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name.substring(0, 2)}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Mulligan Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Mulligan
                    </td>
                    {backNine.map((hole) => {
                      const score = scores.find((s) => s.hole === hole.number);
                      return (
                        <td key={hole.number} className='px-3 py-2 text-center'>
                          <select
                            value={score?.mulligan || ''}
                            onChange={(e) =>
                              updateHoleScore(
                                hole.number,
                                'mulligan',
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className='w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            disabled={teamData.players.every(
                              (p) =>
                                mulliganCounts[p.id] <= 0 &&
                                score?.mulligan !== p.id,
                            )}
                          >
                            <option value=''>-</option>
                            {teamData.players.map((player) => (
                              <option
                                key={player.id}
                                value={player.id}
                                disabled={
                                  mulliganCounts[player.id] <= 0 &&
                                  score?.mulligan !== player.id
                                }
                              >
                                {player.name.substring(0, 2)} (
                                {mulliganCounts[player.id]})
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
