import React from 'react';

const RoomHeader = ({ title, description, participantBadge, onBack }) => {
  return (
    <>
      <button
        type='button'
        className='text-sm text-gray-600 hover:text-gray-900'
        onClick={onBack}>
        ← 목록으로
      </button>
      <div className='mt-3 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
            {title}
          </h1>
          <p className='mt-1 text-sm text-gray-600'>{description}</p>
        </div>
        {participantBadge}
      </div>
    </>
  );
};

export default RoomHeader;
