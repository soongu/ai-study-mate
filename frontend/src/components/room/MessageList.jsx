import React, { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem.jsx';
import MessageListSkeleton from './MessageListSkeleton.jsx';
import { MessageService } from '../../services/messageService.js';
import { useAuthStore } from '../../stores/authStore.js';
import MessageInput from './MessageInput.jsx';
import {
  connect as wsConnect,
  subscribe as wsSubscribe,
  send as wsSend,
} from '../../services/websocketService.js';

/**
 * MessageList
 *
 * 이 컴포넌트는 "채팅 패널"의 본문입니다.
 * - 채팅 패널이 열리면(= open이 true) 최근 메시지를 REST로 한 번 불러옵니다.
 * - 동시에 WebSocket(STOMP) 구독을 시작해, 새로 도착하는 메시지를 실시간으로 추가합니다.
 * - 리스트가 바뀔 때마다 하단으로 자동 스크롤합니다.
 *
 * 용어 간단 정리
 * - REST: 과거 기록을 가져올 때(한 번 요청 → 응답 받기)
 * - WebSocket/STOMP: 실시간으로 들어오는 새 메시지를 받을 때(계속 연결)
 * - 전송 주소: "/app/rooms/{roomId}/chat" (내가 서버에 보내는 길)
 * - 구독 주소: "/topic/rooms/{roomId}" (서버가 모두에게 알려주는 길)
 */
const MessageList = ({ roomId, open }) => {
  // 현재 로그인 사용자(내 메시지 판단용)
  const me = useAuthStore((s) => s.user);
  // 초기 히스토리 로딩 스피너 상태
  const [loading, setLoading] = useState(false);
  // 화면에 보여줄 메시지 배열(오래된 → 최신 순)
  const [messages, setMessages] = useState([]);
  // 리스트 맨 아래를 가리키는 ref(자동 스크롤 목적지)
  const bottomRef = useRef(null);

  // 1) 패널이 열릴 때만 최근 메시지(과거 기록) 로드
  // - REST: GET /api/rooms/{roomId}/messages
  // - 오래된 → 최신 순으로 화면에 보이도록 역순 정렬 후 setMessages
  useEffect(() => {
    if (!open || !roomId) return;
    // ignore: 비동기 작업이 끝나기 전에 컴포넌트가 언마운트되면
    // setState를 호출하지 않도록 막아주는 안전장치 플래그입니다.
    // (언마운트 후 setState 호출 시 React 경고 발생 방지)
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        // 최근 메시지(최신순) 페이지를 가져옵니다.
        const list = await MessageService.getRecent(roomId, 0, 20);
        // 화면에서는 오래된 → 최신 순으로 보여주기 위해 역순으로 세팅합니다.
        if (!ignore) setMessages(list.reverse());
      } finally {
        // 로딩 상태 해제도 언마운트 후에는 호출하지 않습니다.
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      // cleanup: 이후 비동기 콜백이 도착해도 setState가 실행되지 않도록 차단
      ignore = true;
    };
  }, [open, roomId]);

  // 2) 실시간 구독 시작
  // - STOMP 연결을 보장(wsConnect)하고, "/topic/rooms/{roomId}"를 구독합니다.
  // - 새 메시지가 오면 JSON 파싱 후 기존 messages 뒤에 이어 붙입니다.
  useEffect(() => {
    if (!open || !roomId) return;
    // wsConnect: STOMP 클라이언트 활성화(이미 활성화되어 있으면 내부에서 무시)
    wsConnect();
    // 방 토픽 구독: 새 메시지가 들어오면 리스트 뒤에 추가합니다.
    const unsubscribe = wsSubscribe(`/topic/rooms/${roomId}`, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        setMessages((prev) => [...prev, data]);
      } catch {
        // 파싱 실패 시 무시(서버 포맷 변경 등 예외 상황)
      }
    });
    // cleanup: 컴포넌트 언마운트/닫힘 시 구독 해제(중복 수신 방지)
    return () => {
      unsubscribe?.();
    };
  }, [open, roomId]);

  // 3) 자동 스크롤
  // - 리스트 변경 시 항상 하단으로 내려줍니다(최신 메시지가 보이도록)
  useEffect(() => {
    if (!open) return;
    // 최신 메시지가 보이도록 리스트 하단으로 스크롤 이동
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
        {/* 스크롤 목적지: 이 요소가 항상 리스트 맨 아래가 되도록 사용 */}
        <div ref={bottomRef} />
      </div>
      {/* 4) 입력창: Enter 단축키(Shift+Enter는 줄바꿈), 전송 버튼 */}
      <MessageInput
        disabled={!open}
        onSend={(text) => {
          // STOMP 전송: 서버의 @MessageMapping("/rooms/{id}/chat")로 전달됩니다.
          wsSend(`/app/rooms/${roomId}/chat`, { content: text });
        }}
      />
    </div>
  );
};

export default MessageList;
