import React from 'react';

const RoomListSkeleton = ({ count = 8 }) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className='card animate-pulse'>
          <div className='h-5 w-2/3 bg-gray-200 rounded mb-3' />
          <div className='h-4 w-full bg-gray-200 rounded mb-2' />
          <div className='h-4 w-5/6 bg-gray-200 rounded mb-4' />
          <div className='h-6 w-24 bg-gray-200 rounded-full' />
        </div>
      ))}
    </div>
  );
};

export default RoomListSkeleton;
