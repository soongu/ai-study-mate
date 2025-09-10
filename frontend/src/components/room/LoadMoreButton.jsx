import React from 'react';

const LoadMoreButton = ({ disabled, loading, onClick }) => {
  return (
    <div className='mt-8 flex justify-center'>
      <button
        type='button'
        className='btn-primary disabled:opacity-60'
        disabled={disabled}
        onClick={onClick}>
        {loading ? '불러오는 중...' : '더 보기'}
      </button>
    </div>
  );
};

export default LoadMoreButton;
