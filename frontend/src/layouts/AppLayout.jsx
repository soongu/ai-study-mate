import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';

const AppLayout = () => {
  return (
    <div className='min-h-screen flex flex-col'>
      <AppHeader />

      <main className='flex-1'>
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
};

export default AppLayout;
