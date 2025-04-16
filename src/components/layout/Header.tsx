import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header className='bg-[#0B3D2E] text-white shadow-md'>
      <div className='container mx-auto px-4 py-4 flex justify-between items-center'>
        <Link href='/' className='font-bold text-xl'>
          Golf Tournament
        </Link>
        {/* Mobile menu button */}
        <button
          className='md:hidden'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        {/* Desktop navigation */}
        <nav className='hidden md:flex space-x-6'>
          <Link href='/' className='hover:text-gray-200 transition-colors'>
            Home
          </Link>
          <Link
            href='/LeaderboardPage'
            className='hover:text-gray-200 transition-colors'
          >
            Leaderboard
          </Link>
          <Link
            href='/ScoreInputPage'
            className='hover:text-gray-200 transition-colors'
          >
            Enter Scores
          </Link>
          <Link
            href='/AdminTeamsPage'
            className='hover:text-gray-200 transition-colors'
          >
            Admin
          </Link>
          <Link
            href='/login'
            className='bg-white text-[#0B3D2E] px-4 py-1 rounded hover:bg-gray-100 transition-colors'
          >
            Login
          </Link>
        </nav>
      </div>
      {/* Mobile navigation */}
      {isMenuOpen && (
        <nav className='md:hidden px-4 py-2 pb-4 flex flex-col space-y-3 bg-[#0B3D2E] border-t border-[#0a3528]'>
          <Link href='/' className='hover:text-gray-200 transition-colors'>
            Home
          </Link>
          <Link
            href='/LeaderboardPage'
            className='hover:text-gray-200 transition-colors'
          >
            Leaderboard
          </Link>
          <Link
            href='/ScoreInputPage'
            className='hover:text-gray-200 transition-colors'
          >
            Enter Scores
          </Link>
          <Link
            href='/AdminTeamsPage'
            className='hover:text-gray-200 transition-colors'
          >
            Admin
          </Link>
          <Link
            href='/login'
            className='bg-white text-[#0B3D2E] px-4 py-2 rounded text-center hover:bg-gray-100 transition-colors'
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  );
}
