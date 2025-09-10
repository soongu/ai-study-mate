import React from 'react';

const RoomSearchBar = ({ value, onChange }) => {
  return (
    <div className='mb-4'>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder='방 제목 검색'
        className='input-field w-full'
      />
    </div>
  );
};

export default RoomSearchBar;
