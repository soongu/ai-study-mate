import React from 'react';

/**
 * MessageItem: 한 개의 말풍선
 * - isMine: 내 메시지면 우측 정렬/파란색
 */
const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
};

const MessageItem = ({ message, isMine }) => {
  const bubble = isMine
    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm';

  if (isMine) {
    // 내 메시지: 우측 정렬, 아바타 없음
    return (
      <div className='flex justify-end'>
        <div className={`max-w-[70%] px-3 py-2 ${bubble}`}>
          <p className='text-sm whitespace-pre-wrap break-words'>
            {message.content}
          </p>
          <p className='mt-1 text-[10px] text-blue-100 text-right'>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  // 상대 메시지: 좌측 정렬, 아바타 + 닉네임 + 말풍선
  const avatarUrl = message.senderProfileImageUrl;
  const nickname = message.senderNickname;
  const initials = initialsOf(nickname);

  return (
    <div className='flex justify-start'>
      <div className='flex items-start gap-2 max-w-[80%]'>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nickname || '사용자'}
            className='w-8 h-8 rounded-full object-cover shrink-0'
          />
        ) : (
          <div className='w-8 h-8 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-xs font-semibold shrink-0'>
            {initials}
          </div>
        )}
        <div className={`px-3 py-2 ${bubble}`}>
          <p className='text-[11px] text-gray-500 mb-1'>{nickname}</p>
          <p className='text-sm whitespace-pre-wrap break-words'>
            {message.content}
          </p>
          <p className='mt-1 text-[10px] text-gray-500 text-right'>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
