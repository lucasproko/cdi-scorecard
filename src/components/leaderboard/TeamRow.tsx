import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
interface Player {
  name: string;
  drives: number;
  mulligansLeft: number;
}
interface HoleScore {
  hole: number;
  par: number;
  strokes: number;
  drive: string;
  mulligan: string | null;
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
export function TeamRow({ team, isExpanded, onToggle }: TeamRowProps) {
  // Function to format and color-code scores relative to par (E, +X, -X)
  const formatScore = (score: number) => {
    if (score === 0) {
      // Even par - uses neutral color defined by Tailwind text-gray-800
      return <span className='text-gray-800'>E</span>;
    } else if (score < 0) {
      // Under par - uses specific green color class
      return <span className='text-[#34D399]'>{score}</span>;
    } else {
      // Over par - uses specific red color class, prepends +
      return <span className='text-[#EF4444]'>+{score}</span>;
    }
  };
  // Function to format individual hole stroke counts with color coding relative to hole par
  const formatHoleScore = (strokes: number, par: number) => {
    if (strokes < par) {
      return <span className='text-[#34D399] font-medium'>{strokes}</span>;
    } else if (strokes === par) {
      return <span>{strokes}</span>;
    } else {
      return <span className='text-[#EF4444] font-medium'>{strokes}</span>;
    }
  };
  return (
    <div className='bg-white'>
      {/* Main row - clickable to toggle expansion */}
      <div
        className='py-4 px-4 grid grid-cols-12 items-center cursor-pointer hover:bg-gray-50'
        onClick={onToggle}
      >
        <div className='col-span-5 md:col-span-4 font-medium flex items-center'>
          {isExpanded ? (
            <ChevronUp size={18} className='mr-2' />
          ) : (
            <ChevronDown size={18} className='mr-2' />
          )}
          {team.name}
        </div>
        <div className='col-span-2 text-center font-medium'>
          {formatScore(team.grossScore)}
        </div>
        <div className='col-span-2 text-center font-medium'>
          {formatScore(team.netScore)}
        </div>
        <div className='col-span-1 text-center'>{team.thru}</div>
        <div className='col-span-2 md:col-span-3 text-center'>
          {team.remainingMulligans}
        </div>
      </div>
      {/* Expanded details - conditionally rendered based on isExpanded prop */}
      {isExpanded && (
        <div className='bg-gray-50 px-4 py-4'>
          {/* Player stats section */}
          <div className='mb-6'>
            <h4 className='font-medium mb-3'>Player Stats</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {team.players.map((player, idx) => (
                <div key={idx} className='bg-white p-3 rounded-md shadow-sm'>
                  <div className='font-medium'>{player.name}</div>
                  <div className='flex justify-between mt-1 text-sm'>
                    <div>Drives: {player.drives}</div>
                    <div>Mulligans Left: {player.mulligansLeft}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Hole by hole scores - Horizontal scrolling table */}
          <div>
            <h4 className='font-medium mb-3'>Hole Scores</h4>
            <div className='overflow-x-auto'>
              <table className='min-w-full border-collapse'>
                <thead>
                  <tr className='text-xs text-gray-500 border-b'>
                    <th className='py-2 pr-4 text-left sticky left-0 bg-gray-50'>
                      Hole
                    </th>
                    {team.holeScores.map((hole) => (
                      <th key={hole.hole} className='py-2 px-3 text-center'>
                        {hole.hole}
                      </th>
                    ))}
                  </tr>
                  <tr className='text-xs text-gray-500 border-b'>
                    <th className='py-2 pr-4 text-left sticky left-0 bg-gray-50'>
                      Par
                    </th>
                    {team.holeScores.map((hole) => (
                      <th key={hole.hole} className='py-2 px-3 text-center'>
                        {hole.par}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b'>
                    <td className='py-2 pr-4 font-medium sticky left-0 bg-gray-50'>
                      Score
                    </td>
                    {team.holeScores.map((hole) => (
                      <td key={hole.hole} className='py-2 px-3 text-center'>
                        {formatHoleScore(hole.strokes, hole.par)}
                      </td>
                    ))}
                  </tr>
                  <tr className='border-b'>
                    <td className='py-2 pr-4 font-medium sticky left-0 bg-gray-50'>
                      Drive
                    </td>
                    {team.holeScores.map((hole) => (
                      <td
                        key={hole.hole}
                        className='py-2 px-3 text-center text-sm'
                      >
                        {hole.drive}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className='py-2 pr-4 font-medium sticky left-0 bg-gray-50'>
                      Mulligan
                    </td>
                    {team.holeScores.map((hole) => (
                      <td
                        key={hole.hole}
                        className='py-2 px-3 text-center text-sm'
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
