import React from 'react';

import { Hero } from '../components/home/Hero';
// import { TournamentInfo } from '../components/home/TournamentInfo' // Keep import for now
import Layout from '../components/layout/Layout';

export function HomePage() {
  return (
    <Layout>
      <div className='w-full'>
        <Hero />
        {/* <TournamentInfo /> */} {/* Comment out usage */}
      </div>
    </Layout>
  );
}

export default HomePage;
