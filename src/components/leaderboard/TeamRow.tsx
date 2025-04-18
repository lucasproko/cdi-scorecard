import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

// Interfaces (assuming these are defined correctly)
interface HoleScore {
  hole: number;
  par: number;
  strokes: number;
  drive: string;
  mulligan: string | null;
}

interface Player {
  name: string;
  drives: number;
  mulligansLeft: number;
}

interface Team {
  id: number;
  name: string;
  grossScore: number;
  netScore: number;
  thru: number | 'F';
  remainingMulligans: number;
  players: Player[];
  holeScores: HoleScore[];
}

interface TeamRowProps {
  team: Team;
  isExpanded: boolean;
  onToggle: () => void;
}

// Helper function to format scores
const formatScore = (score: number) => {
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return score.toString();
};

// Helper function to color scores
const getScoreColor = (score: number): string => {
  if (score < 0) return 'text-emerald-600';
  if (score > 0) return 'text-red-600';
  return 'text-gray-900';
};

// Helper function to format hole scores relative to par
const formatHoleScore = (strokes: number, par: number): string => {
  const diff = strokes - par;
  if (diff < -1) return 'bg-green-300 text-green-900 font-bold'; // Eagle or better (even darker green)
  if (diff === -1) return 'bg-emerald-50 text-emerald-700 font-bold'; // Birdie (lighter green)
  if (diff === 0) return 'bg-gray-100 text-gray-800'; // Par
  if (diff === 1) return 'bg-red-100 text-red-800'; // Bogey
  if (diff > 1) return 'bg-red-300 text-red-900'; // Double Bogey or worse (darker red)
  return '';
};

export function TeamRow({ team, isExpanded, onToggle }: TeamRowProps) {
  return (
    <div className='bg-white border-b border-gray-200 last:border-b-0'>
      {/* Main row - clickable to toggle expansion */}
      <div
        className='py-4 px-4 grid grid-cols-12 items-center cursor-pointer hover:bg-gray-50 transition-colors duration-150 ease-in-out'
        onClick={onToggle}
      >
        {/* Team Name + Toggle Icon */}
        <div className='col-span-5 md:col-span-4 font-medium flex items-center pl-2'>
          {isExpanded ? (
            <ChevronUp size={18} className='mr-2 text-gray-500' />
          ) : (
            <ChevronDown size={18} className='mr-2 text-gray-500' />
          )}
          <span className='text-gray-800'>{team.name}</span>
        </div>
        {/* Gross Score */}
        <div
          className={`col-span-2 text-center font-semibold ${getScoreColor(team.grossScore)}`}
        >
          {formatScore(team.grossScore)}
        </div>
        {/* Net Score */}
        <div
          className={`col-span-2 text-center font-medium ${getScoreColor(team.netScore)}`}
        >
          {formatScore(team.netScore)}
        </div>
        {/* Thru */}
        <div className='col-span-1 text-center text-gray-600 text-sm'>
          {team.thru}
        </div>
        {/* Mulligans */}
        <div className='col-span-2 md:col-span-3 text-center text-gray-600 pr-2'>
          {team.remainingMulligans}
        </div>
      </div>

      {/* Expanded details - conditionally rendered */}
      {isExpanded && (
        <div className='bg-slate-50/70 px-4 md:px-8 py-6 border-t border-gray-200'>
          {/* Player stats section */}
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-700 mb-3'>Player Stats</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {team.players.map((player, idx) => (
                <div
                  key={idx}
                  className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'
                >
                  <div className='font-medium text-gray-800'>{player.name}</div>
                  <div className='flex justify-between mt-2 text-sm text-gray-600'>
                    <span>Drives: {player.drives}</span>
                    <span>Mulligans Left: {player.mulligansLeft}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hole by hole scores - Horizontal scrolling table */}
          <div>
            <h4 className='font-semibold text-gray-700 mb-3'>Hole Scores</h4>
            <div className='overflow-x-auto rounded-md border border-gray-200 shadow-sm'>
              <table className='min-w-full border-collapse bg-white'>
                <thead>
                  <tr className='text-xs text-gray-600 bg-gray-100 border-b border-gray-200'>
                    {/* Sticky Header for Hole & Par */}
                    <th className='py-2 px-3 text-left sticky left-0 bg-gray-100 z-10 font-medium border-r border-gray-200'>
                      Hole
                    </th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(
                      (holeNum) => (
                        <th
                          key={holeNum}
                          className='py-2 px-3 text-center font-medium'
                        >
                          {holeNum}
                        </th>
                      ),
                    )}
                  </tr>
                  <tr className='text-xs text-gray-600 bg-gray-100 border-b border-gray-200'>
                    <th className='py-2 px-3 text-left sticky left-0 bg-gray-100 z-10 font-medium border-r border-gray-200'>
                      Par
                    </th>
                    {team.holeScores
                      .concat(
                        // Pad with empty cells if round not finished
                        Array.from(
                          { length: 18 - team.holeScores.length },
                          () => ({
                            hole: 0, // Dummy value, not used for rendering par
                            par: 0, // Placeholder
                            strokes: 0,
                            drive: '',
                            mulligan: null,
                          }),
                        ),
                      )
                      .sort((a, b) => a.hole - b.hole) // Ensure sorted by hole
                      .map((hole, idx) => (
                        <th
                          key={idx}
                          className='py-2 px-3 text-center font-medium'
                        >
                          {hole.par || '-'} {/* Show par or dash */}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Score Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='py-2 px-3 font-medium sticky left-0 bg-white z-10 border-r border-gray-200'>
                      Score
                    </td>
                    {team.holeScores
                      .concat(
                        Array.from(
                          { length: 18 - team.holeScores.length },
                          () => ({
                            hole: 0,
                            par: 0,
                            strokes: 0,
                            drive: '',
                            mulligan: null,
                          }),
                        ),
                      )
                      .sort((a, b) => a.hole - b.hole)
                      .map((hole, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-3 text-center font-semibold text-sm ${hole.hole ? formatHoleScore(hole.strokes, hole.par) : 'bg-gray-50'}`}
                        >
                          {hole.hole ? hole.strokes : '-'}{' '}
                          {/* Show strokes or dash */}
                        </td>
                      ))}
                  </tr>
                  {/* Drive Row */}
                  <tr className='border-b border-gray-200'>
                    <td className='py-2 px-3 font-medium sticky left-0 bg-white z-10 border-r border-gray-200'>
                      Drive
                    </td>
                    {team.holeScores
                      .concat(
                        Array.from(
                          { length: 18 - team.holeScores.length },
                          () => ({
                            hole: 0,
                            par: 0,
                            strokes: 0,
                            drive: '',
                            mulligan: null,
                          }),
                        ),
                      )
                      .sort((a, b) => a.hole - b.hole)
                      .map((hole, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-3 text-center text-sm ${!hole.hole ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          {hole.drive || '-'}
                        </td>
                      ))}
                  </tr>
                  {/* Mulligan Row */}
                  <tr>
                    <td className='py-2 px-3 font-medium sticky left-0 bg-white z-10 border-r border-gray-200'>
                      Mulligan
                    </td>
                    {team.holeScores
                      .concat(
                        Array.from(
                          { length: 18 - team.holeScores.length },
                          () => ({
                            hole: 0,
                            par: 0,
                            strokes: 0,
                            drive: '',
                            mulligan: null,
                          }),
                        ),
                      )
                      .sort((a, b) => a.hole - b.hole)
                      .map((hole, idx) => (
                        <td
                          key={idx}
                          className={`py-2 px-3 text-center text-sm ${!hole.hole ? 'text-gray-400' : hole.mulligan ? 'text-orange-600 font-medium' : 'text-gray-500'}`}
                        >
                          {hole.mulligan || '-'}
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
