import React from 'react';

const CodeReviewLauncher = ({ onClick }) => {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='코드 리뷰 열기'
      className='inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm'>
      <span className='inline-block w-4 h-4 rounded bg-indigo-600' />
      코드 리뷰
    </button>
  );
};

export default CodeReviewLauncher;
