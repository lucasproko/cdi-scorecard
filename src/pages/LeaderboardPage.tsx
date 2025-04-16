import React from 'react';

import Layout from '../components/layout/Layout';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';

export function LeaderboardPage() {
  return (
    <Layout>
      <div className='w-full bg-[#F3F4F6] py-8 md:py-12'>
        <div className='container mx-auto px-4'>
          <h1 className='text-3xl md:text-4xl font-bold mb-8 text-center text-[#0B3D2E]'>
            Tournament Leaderboard
          </h1>
          <LeaderboardTable />
        </div>
      </div>
    </Layout>
  );
}

export default LeaderboardPage;
