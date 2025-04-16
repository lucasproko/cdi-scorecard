import React from 'react';

import { AdminTeamsManager } from '../components/admin/AdminTeamsManager';
import Layout from '../components/layout/Layout';

export function AdminTeamsPage() {
  return (
    <Layout>
      <div className='w-full bg-[#F3F4F6] py-8 md:py-12'>
        <div className='container mx-auto px-4'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2 text-center text-[#0B3D2E]'>
            Tournament Admin
          </h1>
          <p className='text-center mb-8 text-gray-600'>
            Manage teams and players for the tournament
          </p>
          <AdminTeamsManager />
        </div>
      </div>
    </Layout>
  );
}

export default AdminTeamsPage;
