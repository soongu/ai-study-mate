import React from 'react';

const AIAssistantFab = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className='fixed z-50 bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'
      aria-label='Open AI Assistant'>
      AI
    </button>
  );
};

export default AIAssistantFab;
