import React from 'react';

const RoomCard = ({
  title,
  description,
  participantsCount = 0,
  maxParticipants = 4,
  onClick,
}) => {
  const isFull = participantsCount >= maxParticipants;

  return (
    <button
      type='button'
      onClick={onClick}
      className={`card-hover w-full text-left ${isFull ? 'opacity-90' : ''}`}>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 line-clamp-1'>
            {title}
          </h3>
          {description && (
            <p className='mt-1 text-sm text-gray-600 line-clamp-2'>
              {description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
            isFull
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
            className='w-4 h-4'>
            <path d='M10 3a4 4 0 00-3.446 6.032A6 6 0 004 14a1 1 0 102 0 4 4 0 018 0 1 1 0 102 0 6 6 0 00-2.554-4.968A4 4 0 0010 3z' />
          </svg>
          {participantsCount}/{maxParticipants}
        </span>
      </div>
    </button>
  );
};

export default RoomCard;
