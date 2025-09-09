import React from 'react';

const AppFooter = () => {
  return (
    <footer className='border-t bg-gray-50'>
      <div className='container mx-auto px-4 h-12 flex items-center justify-center text-xs text-gray-500'>
        © {new Date().getFullYear()} AI Study Mate
      </div>
    </footer>
  );
};

export default AppFooter;
