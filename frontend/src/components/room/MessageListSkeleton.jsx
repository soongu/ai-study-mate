import React from 'react';

const Bar = ({ w = 'w-2/3', right = false }) => (
  <div className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
    <div className={`h-5 ${w} bg-gray-200 rounded-xl`} />
  </div>
);

const MessageListSkeleton = () => (
  <div className='space-y-3'>
    <Bar w='w-1/2' />
    <Bar right />
    <Bar w='w-1/3' />
    <Bar
      w='w-2/3'
      right
    />
    <Bar />
  </div>
);

export default MessageListSkeleton;
