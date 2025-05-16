import React from 'react';

// Placeholder data structure for a team on the leaderboard
interface LeaderboardTeam {
  id: number;
  name: string;
  grossScore: number; // Relative to par, e.g., -2, 0, 5
  netScore: number; // Adjusted for handicap
  thru: string; // e.g., "9", "18", "F"
  mulligansRemaining: number;
  // Add expanded details later: holeScores, driveCounts, playerMulligans
}

const LeaderboardPageContent = () => {
  // Placeholder leaderboard data - replace with actual data fetching
  const leaderboardData: LeaderboardTeam[] = [
    {
      id: 1,
      name: 'Marc & Luke',
      grossScore: -2,
      netScore: -4,
      thru: '18',
      mulligansRemaining: 2,
    },
    {
      id: 2,
      name: 'Team Bogey',
      grossScore: 5,
      netScore: 5,
      thru: '15',
      mulligansRemaining: 4,
    },
    {
      id: 3,
      name: 'Fairway Friends',
      grossScore: 0,
      netScore: -1,
      thru: 'F',
      mulligansRemaining: 1,
    },
  ];

  // Function to determine score color
  const getScoreColor = (score: number): string => {
    if (score < 0) return 'text-green-500'; // Under par
    if (score > 0) return 'text-red-500'; // Over par
    return 'text-black'; // Even par
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-4xl font-bold text-center mb-8 text-primary'>
        Leaderboard
      </h1>

      {/* Leaderboard Table/List - Placeholder */}
      <div className='bg-white shadow-md rounded-lg overflow-hidden'>
        {/* Header Row - Optional */}
        <div className='hidden md:flex bg-gray-200 text-gray-700 uppercase text-sm leading-normal'>
          <div className='py-3 px-6 text-left w-1/4'>Team</div>
          <div className='py-3 px-6 text-center w-1/4'>Gross</div>
          <div className='py-3 px-6 text-center w-1/4'>Net</div>
          <div className='py-3 px-6 text-center w-1/4'>Thru</div>
          <div className='py-3 px-6 text-center w-1/4'>Mulligans Left</div>
        </div>

        {/* Team Rows */}
        <div className='divide-y divide-gray-200'>
          {leaderboardData
            .sort((a, b) => a.grossScore - b.grossScore) // Sort by gross score
            .map((team) => (
              <div key={team.id} className='hover:bg-gray-50'>
                {/* Basic Row - Adapt for mobile and expansion */}
                <div className='flex flex-wrap md:flex-nowrap items-center py-4 px-6'>
                  <div className='w-full md:w-1/4 mb-2 md:mb-0 font-medium text-gray-800'>
                    {team.name}
                  </div>
                  <div
                    className={`w-1/3 md:w-1/4 text-center font-semibold ${getScoreColor(team.grossScore)}`}
                  >
                    {team.grossScore > 0
                      ? `+${team.grossScore}`
                      : team.grossScore === 0
                        ? 'E'
                        : team.grossScore}
                  </div>
                  <div
                    className={`w-1/3 md:w-1/4 text-center ${getScoreColor(team.netScore)}`}
                  >
                    {team.netScore > 0
                      ? `+${team.netScore}`
                      : team.netScore === 0
                        ? 'E'
                        : team.netScore}
                  </div>
                  <div className='w-1/3 md:w-1/4 text-center text-gray-600'>
                    {team.thru}
                  </div>
                  <div className='w-full md:w-1/4 text-center text-gray-600 mt-2 md:mt-0'>
                    {team.mulligansRemaining} Mulligans Left
                  </div>
                </div>
                {/* Add Expanded View section here later */}
              </div>
            ))}
        </div>
      </div>

      {/* Add auto-refresh logic/button later */}
    </div>
  );
};

export default LeaderboardPageContent;
