import React from 'react';

const AIAssistantFab = ({ onClick, hidden }) => {
  return (
    <button
      onClick={onClick}
      className={
        'fixed z-40 bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-opacity ' +
        (hidden ? 'opacity-0 pointer-events-none' : 'opacity-100')
      }
      aria-label='Open AI Assistant'
      title='AI 도우미 열기'>
      <svg
        width='22'
        height='22'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='mx-auto'>
        <path
          d='M12 3a9 9 0 100 18 9 9 0 000-18z'
          stroke='currentColor'
          strokeWidth='2'
        />
        <path
          d='M8 10h8M8 14h5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </svg>
    </button>
  );
};

export default AIAssistantFab;
