import React from 'react';

const ParticipantsList = ({ participants }) => {
  if (!participants || participants.length === 0) {
    return <p className='mt-2 text-sm text-gray-600'>참여자가 아직 없어요.</p>;
  }

  return (
    <ul className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3'>
      {participants.map((p) => (
        <li
          key={p.id}
          className='card w-full'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {p.profileImageUrl ? (
                <img
                  src={p.profileImageUrl}
                  alt={p.nickname || '사용자'}
                  className='w-9 h-9 rounded-full object-cover'
                />
              ) : (
                <div className='w-9 h-9 rounded-full bg-gray-200' />
              )}
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {p.nickname || p.name || '사용자'}
                </p>
                {p.role && <p className='text-xs text-gray-500'>{p.role}</p>}
              </div>
            </div>
            {(() => {
              const status = p.status || 'OFFLINE';
              const badge = {
                ONLINE: 'bg-green-50 text-green-700 border-green-200',
                STUDYING: 'bg-blue-50 text-blue-700 border-blue-200',
                BREAK: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                OFFLINE: 'bg-gray-200 text-gray-600 border-gray-300',
              };
              const dot = {
                ONLINE: 'bg-green-500',
                STUDYING: 'bg-blue-500',
                BREAK: 'bg-yellow-500',
                OFFLINE: 'bg-gray-400',
              };
              const badgeCls = `inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
                badge[status] || badge.OFFLINE
              }`;
              const dotCls = `w-2 h-2 rounded-full mr-1 ${
                dot[status] || dot.OFFLINE
              }`;
              return (
                <span className={badgeCls}>
                  <span className={dotCls} />
                  {status}
                </span>
              );
            })()}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ParticipantsList;
