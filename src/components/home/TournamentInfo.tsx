import React from 'react';
export function TournamentInfo() {
  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-3xl font-bold text-center mb-12'>
            Tournament Details
          </h2>
          <div className='grid md:grid-cols-2 gap-8'>
            <div className='bg-[#F3F4F6] p-6 rounded-lg'>
              <h3 className='text-xl font-bold mb-3 text-[#0B3D2E]'>
                Schedule
              </h3>
              <ul className='space-y-3'>
                <li className='flex justify-between'>
                  <span>Registration</span>
                  <span>8:00 AM</span>
                </li>
                <li className='flex justify-between'>
                  <span>Tee Off</span>
                  <span>9:30 AM</span>
                </li>
                <li className='flex justify-between'>
                  <span>Awards Ceremony</span>
                  <span>5:00 PM</span>
                </li>
              </ul>
            </div>
            <div className='bg-[#F3F4F6] p-6 rounded-lg'>
              <h3 className='text-xl font-bold mb-3 text-[#0B3D2E]'>
                Location
              </h3>
              <address className='not-italic'>
                <p>Pebble Creek Golf Club</p>
                <p>123 Fairway Drive</p>
                <p>Golf City, GC 12345</p>
                <p className='mt-2'>
                  <a
                    href='tel:+15551234567'
                    className='text-[#0B3D2E] underline'
                  >
                    (555) 123-4567
                  </a>
                </p>
              </address>
            </div>
          </div>
          <div className='mt-12 text-center'>
            <p className='text-lg mb-6'>
              Join us for a day of friendly competition and networking on the
              green!
            </p>
            <a
              href='#'
              className='inline-block bg-[#0B3D2E] text-white px-6 py-3 rounded-md font-medium hover:bg-[#0a3528] transition-colors'
            >
              Register Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export {};
