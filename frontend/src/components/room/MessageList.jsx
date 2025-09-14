import React, { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem.jsx';
import MessageListSkeleton from './MessageListSkeleton.jsx';
import { MessageService } from '../../services/messageService.js';
import { useAuthStore } from '../../stores/authStore.js';

/**
 * MessageList: 채팅 패널이 열릴 때 최근 메시지를 불러와 렌더합니다.
 * - 최초 로드 완료 후 하단으로 자동 스크롤
 */
const MessageList = ({ roomId, open }) => {
  const me = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // 디자인 미리보기용 더미 데이터 (개발 환경에서만 사용)
  // 실제 REST/실시간 연동 전에 말풍선 스타일을 확인하기 위한 용도입니다.
  const USE_DEMO = import.meta.env.DEV === true; // 개발 모드일 때만 true
  const DEMO_MESSAGES = [
    {
      id: 1,
      roomId,
      senderId: 101,
      senderNickname: 'Alice',
      content: '안녕하세요! 오늘 스터디 주제는 WebSocket이에요.',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 2,
      roomId,
      senderId: 202,
      senderNickname: 'Bob',
      content: '좋아요! STOMP랑 차이도 같이 보면 좋겠네요.',
      createdAt: new Date(Date.now() - 1000 * 60 * 4 + 10_000).toISOString(),
    },
    {
      id: 3,
      roomId,
      senderId: 101,
      senderNickname: 'Alice',
      content: '맞아요. 메시지 주소 체계랑 브로커 개념이 핵심이에요.',
      createdAt: new Date(Date.now() - 1000 * 60 * 3 + 20_000).toISOString(),
    },
    {
      id: 4,
      roomId,
      senderId: me?.id ?? 303, // 내 버블 예시가 보이도록 임의 ID 사용
      senderNickname: me?.nickname ?? '나',
      content: '테스트 메시지입니다. (내 말풍선)',
      createdAt: new Date(Date.now() - 1000 * 60 * 2 + 30_000).toISOString(),
    },
    {
      id: 5,
      roomId,
      senderId: 202,
      senderNickname: 'Bob',
      content: '자동 스크롤도 되는지 확인해볼게요!\n두 줄도 확인!',
      createdAt: new Date(Date.now() - 1000 * 60 * 1 + 40_000).toISOString(),
    },
  ];

  // 패널이 열릴 때만 로드
  useEffect(() => {
    if (!open || !roomId) return;
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        if (USE_DEMO) {
          // 개발 미리보기: 더미 데이터를 오래된→최신 순으로 렌더
          if (!ignore) setMessages([...DEMO_MESSAGES]);
          return;
        }
        const list = await MessageService.getRecent(roomId, 0, 20);
        if (!ignore) setMessages(list.reverse()); // 오래된→최신 순으로 렌더
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [open, roomId, USE_DEMO]);

  // 로드/변경 시 하단으로 스크롤
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [open, messages]);

  if (!open) return null;

  return (
    <div className='flex flex-col h-full border rounded-lg bg-white'>
      <div className='flex-1 overflow-auto p-3 space-y-2'>
        {loading ? (
          <MessageListSkeleton />
        ) : messages.length === 0 ? (
          <p className='text-sm text-gray-500'>
            아직 메시지가 없어요. 첫 메시지를 보내보세요!
          </p>
        ) : (
          messages.map((m) => (
            <MessageItem
              key={m.id}
              message={m}
              isMine={me && m.senderId === me.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
