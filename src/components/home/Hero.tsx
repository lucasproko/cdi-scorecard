import Link from 'next/link';
import React from 'react';

export function Hero() {
  return (
    <section className='bg-[#0B3D2E] text-white py-16 md:py-24'>
      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto text-center'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6'>
            2023 Golf Tournament
          </h1>
          <p className='text-xl md:text-2xl mb-8'>
            June 15-17, 2023 • Pebble Creek Golf Club
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4'>
            <Link
              href='/leaderboard'
              className='bg-white text-[#0B3D2E] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors'
            >
              View Leaderboard
            </Link>
            <Link
              href='/register'
              className='bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors'
            >
              Join Team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
