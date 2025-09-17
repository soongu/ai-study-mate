import React from 'react';

const RoomActions = ({
  isHost,
  isFull,
  isMemberNonHost,
  joining,
  leaving,
  onJoin,
  onLeave,
}) => {
  if (isHost) return null;
  return (
    <div className='space-y-3'>
      <button
        type='button'
        className='btn-primary w-full disabled:opacity-60'
        disabled={joining || isFull || isMemberNonHost}
        onClick={onJoin}>
        {joining
          ? '참여 중...'
          : isFull
          ? '정원이 가득찼어요'
          : isMemberNonHost
          ? '이미 참여 중'
          : '참여하기'}
      </button>
      <button
        type='button'
        className='btn-secondary w-full disabled:opacity-60'
        disabled={leaving || !isMemberNonHost}
        onClick={onLeave}>
        {leaving ? '나가는 중...' : '나가기'}
      </button>
    </div>
  );
};

export default RoomActions;
