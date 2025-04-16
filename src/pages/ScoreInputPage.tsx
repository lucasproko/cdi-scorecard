import React, { useState } from 'react';

import Layout from '../components/layout/Layout';
import {
  ScoreInputForm,
  SubmittedScoreData,
} from '../components/scoring/ScoreInputForm';

// console.log('Imported ScoreInputForm:', ScoreInputForm); // REMOVE

export function ScoreInputPage() {
  // console.log('Rendering ScoreInputPage'); // REMOVE

  // State to control display of success message after submission
  const [isSubmitted, setIsSubmitted] = useState(false);

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
  // Mock team data - in a real app this would come from an API or user selection
  const teamData = {
    id: 1,
    name: 'Your Team',
    players: [
      {
        id: 1,
        name: 'Player 1',
        mulligansLeft: 3,
      },
      {
        id: 2,
        name: 'Player 2',
        mulligansLeft: 3,
      },
    ],
  };
  const handleSubmitScores = (_scoreData: SubmittedScoreData) => {
    // console.log('Simulating score submission:', _scoreData); // Keep commented out or remove
    // In a real app, this would send data to an API
    setIsSubmitted(true);
    // Redirect to leaderboard after a short delay
    setTimeout(() => {
      window.location.href = '/LeaderboardPage';
    }, 2000);
  };
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
          {isSubmitted ? (
            <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative max-w-3xl mx-auto'>
              <strong className='font-bold'>Success!</strong>
              <span className='block sm:inline'>
                {' '}
                Your scores have been submitted.
              </span>
              <p className='mt-2'>Redirecting to leaderboard...</p>
            </div>
          ) : (
            <ScoreInputForm
              courseData={courseData}
              teamData={teamData}
              onSubmit={handleSubmitScores}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ScoreInputPage;
