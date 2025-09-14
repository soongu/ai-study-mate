import React from 'react';

// 시스템 메시지(입장/퇴장 등)를 채팅창 가운데 라벨 형태로 표시
const MessageSystemItem = ({ text }) => {
  return (
    <div className='flex justify-center my-2'>
      <span className='text-[12px] text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-3 py-1'>
        {text}
      </span>
    </div>
  );
};

export default MessageSystemItem;
