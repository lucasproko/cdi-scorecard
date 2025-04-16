import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-[#0B3D2E] text-white py-6'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-sm'>Golf Tournament App &copy; {currentYear}</p>
      </div>
    </footer>
  );
}
