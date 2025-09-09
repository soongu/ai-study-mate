import React from 'react';
import { Link } from 'react-router-dom';

const AppHeader = () => {
  return (
    <header className='border-b bg-white'>
      <div className='container mx-auto px-4 h-14 flex items-center justify-between'>
        <Link
          to='/app'
          className='text-lg font-semibold text-gray-900'>
          AI Study Mate
        </Link>
        <nav className='flex items-center gap-4 text-sm text-gray-600'>
          <Link
            to='/app'
            className='hover:text-gray-900'>
            홈
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
