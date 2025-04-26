import Link from 'next/link';
import React from 'react';

import Layout from '../components/layout/Layout';

export function HomePage() {
  return (
    <Layout>
      <div className='flex flex-col items-center justify-center min-h-[80vh] bg-gray-100 px-4'>
        <h1 className='text-4xl md:text-5xl font-bold mb-10 text-[#0B3D2E] text-center'>
          Select Tournament
        </h1>
        <div className='flex flex-col md:flex-row gap-6 w-full max-w-2xl'>
          <Link
            href='/tournament/2-man'
            className='flex-1 bg-white hover:bg-gray-50 border-2 border-[#0B3D2E] rounded-lg shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-1'
          >
            <div className='p-8 md:p-10 flex flex-col items-center justify-center text-center h-full'>
              <h2 className='text-3xl font-bold text-[#0B3D2E] mb-3'>
                Saturday
              </h2>
              <p className='text-gray-600'>2-man scramble</p>
            </div>
          </Link>

          <Link
            href='/tournament/4-man'
            className='flex-1 bg-white hover:bg-gray-50 border-2 border-[#0B3D2E] rounded-lg shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-1'
          >
            <div className='p-8 md:p-10 flex flex-col items-center justify-center text-center h-full'>
              <h2 className='text-3xl font-bold text-[#0B3D2E] mb-3'>Sunday</h2>
              <p className='text-gray-600'>4-man scramble</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
