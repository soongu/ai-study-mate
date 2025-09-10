import React from 'react';
import RoomCard from './RoomCard.jsx';

const RoomListGrid = ({ rooms, onCardClick }) => {
  if (!rooms?.length) return null;
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          title={room.title}
          description={room.description}
          participantsCount={room.participantsCount}
          maxParticipants={room.maxParticipants}
          onClick={() => onCardClick?.(room)}
        />
      ))}
    </div>
  );
};

export default RoomListGrid;
