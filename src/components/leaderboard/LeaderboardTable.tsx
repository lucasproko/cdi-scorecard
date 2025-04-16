import React, { useState } from 'react';

import { TeamRow } from './TeamRow';

// Mock data for the leaderboard
const mockTeams = [
  {
    id: 1,
    name: 'Marc & Luke',
    grossScore: -2,
    netScore: -4,
    thru: 'F',
    remainingMulligans: 3,
    players: [
      {
        name: 'Marc Johnson',
        drives: 9,
        mulligansLeft: 2,
      },
      {
        name: 'Luke Smith',
        drives: 9,
        mulligansLeft: 1,
      },
    ],
    holeScores: [
      {
        hole: 1,
        par: 4,
        strokes: 4,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 2,
        par: 3,
        strokes: 2,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 3,
        par: 5,
        strokes: 5,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 4,
        par: 4,
        strokes: 3,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 5,
        par: 4,
        strokes: 4,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 6,
        par: 3,
        strokes: 3,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 7,
        par: 5,
        strokes: 6,
        drive: 'L',
        mulligan: 'M',
      },
      {
        hole: 8,
        par: 4,
        strokes: 4,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 9,
        par: 4,
        strokes: 3,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 10,
        par: 4,
        strokes: 4,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 11,
        par: 3,
        strokes: 3,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 12,
        par: 5,
        strokes: 4,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 13,
        par: 4,
        strokes: 5,
        drive: 'L',
        mulligan: 'L',
      },
      {
        hole: 14,
        par: 4,
        strokes: 4,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 15,
        par: 3,
        strokes: 2,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 16,
        par: 5,
        strokes: 5,
        drive: 'M',
        mulligan: null,
      },
      {
        hole: 17,
        par: 4,
        strokes: 4,
        drive: 'L',
        mulligan: null,
      },
      {
        hole: 18,
        par: 4,
        strokes: 3,
        drive: 'M',
        mulligan: null,
      },
    ],
  },
  {
    id: 2,
    name: 'Jane & John',
    grossScore: 0,
    netScore: -2,
    thru: 'F',
    remainingMulligans: 2,
    players: [
      {
        name: 'Jane Doe',
        drives: 8,
        mulligansLeft: 1,
      },
      {
        name: 'John Doe',
        drives: 10,
        mulligansLeft: 1,
      },
    ],
    holeScores: [
      {
        hole: 1,
        par: 4,
        strokes: 4,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 2,
        par: 3,
        strokes: 3,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 3,
        par: 5,
        strokes: 4,
        drive: 'J',
        mulligan: 'Jn',
      },
      {
        hole: 4,
        par: 4,
        strokes: 4,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 5,
        par: 4,
        strokes: 5,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 6,
        par: 3,
        strokes: 2,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 7,
        par: 5,
        strokes: 5,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 8,
        par: 4,
        strokes: 4,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 9,
        par: 4,
        strokes: 3,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 10,
        par: 4,
        strokes: 4,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 11,
        par: 3,
        strokes: 3,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 12,
        par: 5,
        strokes: 6,
        drive: 'Jn',
        mulligan: 'J',
      },
      {
        hole: 13,
        par: 4,
        strokes: 4,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 14,
        par: 4,
        strokes: 4,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 15,
        par: 3,
        strokes: 3,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 16,
        par: 5,
        strokes: 5,
        drive: 'Jn',
        mulligan: null,
      },
      {
        hole: 17,
        par: 4,
        strokes: 4,
        drive: 'J',
        mulligan: null,
      },
      {
        hole: 18,
        par: 4,
        strokes: 5,
        drive: 'Jn',
        mulligan: null,
      },
    ],
  },
  {
    id: 3,
    name: 'Alice & Bob',
    grossScore: 4,
    netScore: 2,
    thru: 16,
    remainingMulligans: 0,
    players: [
      {
        name: 'Alice Cooper',
        drives: 7,
        mulligansLeft: 0,
      },
      {
        name: 'Bob Wilson',
        drives: 9,
        mulligansLeft: 0,
      },
    ],
    holeScores: [
      {
        hole: 1,
        par: 4,
        strokes: 5,
        drive: 'B',
        mulligan: 'A',
      },
      {
        hole: 2,
        par: 3,
        strokes: 4,
        drive: 'A',
        mulligan: null,
      },
      {
        hole: 3,
        par: 5,
        strokes: 6,
        drive: 'B',
        mulligan: 'B',
      },
      {
        hole: 4,
        par: 4,
        strokes: 5,
        drive: 'A',
        mulligan: null,
      },
      {
        hole: 5,
        par: 4,
        strokes: 4,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 6,
        par: 3,
        strokes: 4,
        drive: 'A',
        mulligan: null,
      },
      {
        hole: 7,
        par: 5,
        strokes: 5,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 8,
        par: 4,
        strokes: 4,
        drive: 'A',
        mulligan: 'A',
      },
      {
        hole: 9,
        par: 4,
        strokes: 5,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 10,
        par: 4,
        strokes: 4,
        drive: 'A',
        mulligan: null,
      },
      {
        hole: 11,
        par: 3,
        strokes: 4,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 12,
        par: 5,
        strokes: 6,
        drive: 'A',
        mulligan: 'B',
      },
      {
        hole: 13,
        par: 4,
        strokes: 5,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 14,
        par: 4,
        strokes: 5,
        drive: 'A',
        mulligan: 'A',
      },
      {
        hole: 15,
        par: 3,
        strokes: 3,
        drive: 'B',
        mulligan: null,
      },
      {
        hole: 16,
        par: 5,
        strokes: 7,
        drive: 'A',
        mulligan: null,
      },
    ],
  },
];
export function LeaderboardTable() {
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const toggleExpand = (teamId: number) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };
  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden mb-8'>
      <div className='bg-[#0B3D2E] text-white py-3 px-4 grid grid-cols-12 text-sm font-medium'>
        <div className='col-span-5 md:col-span-4'>Team</div>
        <div className='col-span-2 text-center'>Gross</div>
        <div className='col-span-2 text-center'>Net</div>
        <div className='col-span-1 text-center'>Thru</div>
        <div className='col-span-2 md:col-span-3 text-center'>
          Mulligans Left
        </div>
      </div>
      <div className='divide-y divide-gray-200'>
        {mockTeams.map((team) => (
          <TeamRow
            key={team.id}
            team={team}
            isExpanded={expandedTeamId === team.id}
            onToggle={() => toggleExpand(team.id)}
          />
        ))}
      </div>
    </div>
  );
}
