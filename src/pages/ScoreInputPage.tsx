import React from 'react';

import Layout from '../components/layout/Layout';
import ScoreInputForm from '../components/scoreInput/ScoreInputForm';
import { TournamentType } from '../types/supabase';

// console.log('Imported ScoreInputForm:', ScoreInputForm); // REMOVE

export function ScoreInputPage() {
  // console.log('Rendering ScoreInputPage'); // REMOVE

  // Mock course data - in a real app this would come from an API
  const courseData = {
    holes: Array.from(
      {
        length: 18,
      },
      (_, i) => ({
        number: i + 1,
        par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3, // Alternating par 5, 4, 3
      }),
    ),
  };

  // Create coursePars from courseData
  const coursePars = courseData.holes.reduce(
    (acc, hole) => {
      acc[hole.number.toString()] = hole.par;
      return acc;
    },
    {} as { [key: string]: number },
  );

  // Mock team data - in a real app this would come from an API or user selection
  const teamData = {
    id: '1', // Assuming teamId is a string now based on ScoreInputForm props
    name: 'Your Team',
    players: [
      { id: 1, name: 'Player 1', mulligansLeft: 3 },
      { id: 2, name: 'Player 2', mulligansLeft: 3 },
    ],
  };

  // Create playerMap from teamData
  const playerMap = new Map<string, number>();
  teamData.players.forEach((player, index) => {
    playerMap.set(player.id.toString(), index);
  });

  // Mock tournament type (using a valid value from the defined type)
  const tournamentType: TournamentType = '2-man';
  const minDrivesPerPlayer = 5;

  return (
    <Layout>
      <div className='w-full bg-[#F3F4F6] py-8 md:py-12'>
        <div className='container mx-auto px-4'>
          <h1 className='text-3xl md:text-4xl font-bold mb-4 text-center text-[#0B3D2E]'>
            Score Input
          </h1>
          <p className='text-center mb-8 max-w-2xl mx-auto'>
            Enter your team's scores for each hole. Remember to select which
            player's drive was used and mark any mulligans.
          </p>
          <ScoreInputForm
            teamId={teamData.id}
            tournamentType={tournamentType}
            minDrivesPerPlayer={minDrivesPerPlayer}
            coursePars={coursePars}
            playerMap={playerMap}
          />
        </div>
      </div>
    </Layout>
  );
}

export default ScoreInputPage;
