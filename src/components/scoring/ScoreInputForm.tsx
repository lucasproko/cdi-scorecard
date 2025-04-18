import React, { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useScoreSubmission } from '../../lib/useScoreSubmission';

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
  teamId: string;
  minDrivesPerPlayer: number;
  coursePars: { [key: string]: number };
}

// Helper function to format hole scores relative to par (updated colors)
const formatHoleScore = (strokes: number | null, par: number): string => {
  if (strokes === null) return ''; // No score, no special style
  const diff = strokes - par;
  if (diff < -1) return 'bg-green-300 text-green-900 font-bold'; // Eagle or better (even darker green)
  if (diff === -1) return 'bg-emerald-50 text-emerald-700 font-bold'; // Birdie (lighter green)
  if (diff === 0) return 'bg-gray-100 text-gray-800'; // Par
  if (diff === 1) return 'bg-red-100 text-red-800'; // Bogey
  if (diff > 1) return 'bg-red-300 text-red-900'; // Double Bogey or worse (darker red)
  return '';
};

export function ScoreInputForm({
  courseData,
  teamData,
  onSubmit,
  teamId,
  minDrivesPerPlayer,
  coursePars,
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
  const [formError, setFormError] = useState<string | null>(null);
  const [savingHole, setSavingHole] = useState<number | null>(null);
  const {
    submitSingleScore,
    error: submissionError,
    clearError,
  } = useScoreSubmission();
  // Initialize drive and mulligan counts
  useEffect(() => {
    const drives: Record<number, number> = {};
    const mulligans: Record<number, number> = {};
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
    const minDriveCount = minDrivesPerPlayer;
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
  }, [
    scores,
    driveCounts,
    mulliganCounts,
    onSubmit,
    teamData.id,
    minDrivesPerPlayer,
  ]); // Add missing dependencies
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
                [score.drive as number]: prev[score.drive as number] - 1,
              }));
            }
            // Increment new drive count if it exists
            if (value !== null) {
              setDriveCounts((prev) => ({
                ...prev,
                [value]: prev[value] + 1,
              }));
            }
          }
          // If changing mulligan selection, update mulligan counts
          if (field === 'mulligan') {
            // If removing a mulligan, return it to the player
            if (score.mulligan !== null && value === null) {
              setMulliganCounts((prev) => ({
                ...prev,
                [score.mulligan as number]: prev[score.mulligan as number] + 1,
              }));
            }
            // If adding a new mulligan, deduct it from the player
            if (value !== null && score.mulligan !== value) {
              // Return the previous mulligan if there was one
              if (score.mulligan !== null) {
                setMulliganCounts((prev) => ({
                  ...prev,
                  [score.mulligan as number]:
                    prev[score.mulligan as number] + 1,
                }));
              }
              // Deduct the new mulligan
              setMulliganCounts((prev) => ({
                ...prev,
                [value]: prev[value] - 1,
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

  // Function to render table rows for a set of holes
  const renderTableRows = (holes: Hole[]) => {
    return (
      <>
        {/* Par Row */}
        <tr className='border-b border-gray-200'>
          <td className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10 text-sm'>
            Par
          </td>
          {holes.map((hole) => (
            <td key={hole.number} className='px-1 py-2 text-center'>
              {hole.par}
            </td>
          ))}
        </tr>
        {/* Score Row */}
        <tr className='border-b border-gray-200'>
          <td className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10 text-sm'>
            Score
          </td>
          {holes.map((hole) => {
            const score = scores.find((s) => s.hole === hole.number);
            const scoreClass = formatHoleScore(
              score?.strokes ?? null,
              hole.par,
            );
            return (
              <td key={hole.number} className='px-1 py-2 text-center'>
                <input
                  type='number'
                  min='1'
                  max='12'
                  value={
                    score?.strokes === null || score?.strokes === undefined
                      ? ''
                      : score.strokes
                  }
                  onChange={(e) =>
                    updateHoleScore(
                      hole.number,
                      'strokes',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className={`w-full border border-gray-300 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#0B3D2E] ${scoreClass}`}
                />
              </td>
            );
          })}
        </tr>
        {/* Drive Row */}
        <tr className='border-b border-gray-200'>
          <td className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10 text-sm'>
            Drive
          </td>
          {holes.map((hole) => {
            const score = scores.find((s) => s.hole === hole.number);
            return (
              <td key={hole.number} className='px-1 py-2 text-center'>
                <Select
                  value={score?.drive?.toString() ?? ''}
                  onValueChange={(value) =>
                    updateHoleScore(
                      hole.number,
                      'drive',
                      value === 'null' || !value ? null : Number(value),
                    )
                  }
                >
                  <SelectTrigger className='w-12 h-8 px-1 py-1 text-sm mx-auto'>
                    <SelectValue placeholder='-' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='null' className='text-gray-500'>
                      -
                    </SelectItem>
                    {teamData.players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name.substring(0, 2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            );
          })}
        </tr>
        {/* Mulligan Row */}
        <tr>
          <td className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10 text-sm'>
            Mulligan
          </td>
          {holes.map((hole) => {
            const score = scores.find((s) => s.hole === hole.number);
            return (
              <td key={hole.number} className='px-1 py-2 text-center'>
                <Select
                  value={score?.mulligan?.toString() ?? ''}
                  onValueChange={(value) =>
                    updateHoleScore(
                      hole.number,
                      'mulligan',
                      value === 'null' || !value ? null : Number(value),
                    )
                  }
                >
                  <SelectTrigger className='w-12 h-8 px-1 py-1 text-sm mx-auto'>
                    <SelectValue placeholder='-' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='null' className='text-gray-500'>
                      -
                    </SelectItem>
                    {teamData.players.map((player) => {
                      const remaining =
                        score?.mulligan === player.id
                          ? mulliganCounts[player.id] + 1
                          : mulliganCounts[player.id];
                      const isDisabled =
                        remaining <= 0 && score?.mulligan !== player.id;
                      return (
                        <SelectItem
                          key={player.id}
                          value={player.id.toString()}
                          disabled={isDisabled}
                        >
                          {player.name.substring(0, 2)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </td>
            );
          })}
        </tr>
      </>
    );
  };

  return (
    <div className='max-w-full mx-auto'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden mb-8'>
        <div className='bg-[#0B3D2E] text-white px-6 py-4 flex justify-between items-center'>
          <h2 className='text-xl font-bold'>{teamData.name}</h2>
          <div className='flex space-x-6'>
            {teamData.players.map((player) => (
              <div key={player.id} className='text-sm'>
                <span className='font-medium'>{player.name}:</span>{' '}
                <span>{mulliganCounts[player.id] ?? 0} mulligans left</span>
              </div>
            ))}
          </div>
        </div>
        <div className='p-6'>
          {/* Drive summary */}
          <div className='mb-6 bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium mb-2'>Drive Count</h3>
            <div className='flex justify-between'>
              {teamData.players.map((player) => {
                const count = driveCounts[player.id] ?? 0;
                const minDriveCount = minDrivesPerPlayer;
                const isLow = count < minDriveCount;
                const isFinished = scores.every((s) => s.drive !== null);
                const remainingHoles = scores.filter(
                  (s) => s.drive === null,
                ).length;
                const isImpossible = isFinished && isLow;

                return (
                  <div key={player.id}>
                    <span className='font-medium'>{player.name}:</span>{' '}
                    <span
                      className={`font-semibold ${
                        isImpossible
                          ? 'text-red-600'
                          : isLow
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }`}
                    >
                      {count} / {minDriveCount} needed
                    </span>
                    {isImpossible && (
                      <span className='text-xs text-red-500 ml-1'>
                        (Impossible)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className='text-sm text-gray-500 mt-2'>
              Each player must use their drive at least {minDrivesPerPlayer}{' '}
              times. Counts update as you select drives.
            </div>
          </div>
          {/* Front Nine */}
          <div className='mb-10'>
            <h3 className='font-bold mb-3 text-lg'>Front Nine</h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Hole
                    </th>
                    {frontNine.map((hole) => (
                      <th
                        key={hole.number}
                        className='px-1 py-2 text-center font-medium text-gray-700 min-w-[45px]'
                      >
                        {hole.number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{renderTableRows(frontNine)}</tbody>
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
                    <th className='px-1 py-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10'>
                      Hole
                    </th>
                    {backNine.map((hole) => (
                      <th
                        key={hole.number}
                        className='px-1 py-2 text-center font-medium text-gray-700 min-w-[45px]'
                      >
                        {hole.number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>{renderTableRows(backNine)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
