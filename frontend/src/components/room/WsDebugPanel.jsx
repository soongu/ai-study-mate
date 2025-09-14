/**
 * WebSocket 연결 테스트 컴포넌트 (임시)
 *
 * 목적
 * - MVP 단계에서 WebSocket(STOMP) 연결/해제를 간편히 테스트합니다.
 * - 실제 채팅 기능 연동 전까지 연결 상태를 눈으로 확인할 수 있습니다.
 *
 * 주의
 * - 실제 채팅 UI가 붙는 시점에 이 컴포넌트는 삭제합니다.
 */
import React, { useEffect, useState } from 'react';
import {
  connect as wsConnect,
  disconnect as wsDisconnect,
  getState as getWsState,
  setOnStateChange,
  ConnectionState,
  send as wsSend,
} from '../../services/websocketService.js';
// 이 파일은 테스트 용도로 사용되었으며, Commit 7에서 제거되었습니다.
export default function WsDebugPanel() { return null; }
const badgeClass = (state) => {
  if (state === ConnectionState.CONNECTED)
    return 'bg-green-50 text-green-700 border-green-200';
  if (state === ConnectionState.CONNECTING)
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const WsDebugPanel = ({ roomId: roomIdProp }) => {
  // 현재 연결 상태를 화면에 보여주기 위한 로컬 상태
  const [state, setState] = useState(getWsState());
  // 테스트용 방 ID와 메시지 입력값을 관리합니다.
  const [roomId, setRoomId] = useState(roomIdProp ? String(roomIdProp) : '');
  const [text, setText] = useState('');
  // 수신 테스트는 이번 커밋에서 제외합니다(송신만 유지).

  useEffect(() => {
    // 연결 상태가 바뀔 때마다 로컬 상태를 갱신해 배지를 업데이트
    setOnStateChange(setState);
  }, []);


  // 서버로 메시지를 전송합니다. 예) /app/rooms/123/chat
  const handleSend = () => {
    const trimmed = String(roomId || '').trim();
    if (!trimmed || !text) return;
    const dest = `/app/rooms/${trimmed}/chat`;
    // MVP 테스트: 단순 텍스트 페이로드 전송
    wsSend(dest, { text });
    setText('');
  };

  return (
    <div className='mt-6 rounded-lg border p-4 bg-white'>
      {/* 실제 기능 적용 시 이 블록 삭제 */}
      <p className='text-sm text-gray-700'>
        WebSocket 연결 상태를 테스트하는 임시 패널입니다. (추후 실제 기능 적용
        시 삭제)
      </p>
      <div className='mt-3 flex items-center gap-3'>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium border ${badgeClass(
            state
          )}`}>
          상태: {state}
        </span>
        <button
          type='button'
          className='btn-secondary'
          onClick={() => wsConnect()}
          disabled={
            state === ConnectionState.CONNECTING ||
            state === ConnectionState.CONNECTED
          }>
          연결
        </button>
        <button
          type='button'
          className='btn-secondary'
          onClick={() => wsDisconnect()}
          disabled={state === ConnectionState.DISCONNECTED}>
          해제
        </button>
      </div>


      <div className='mt-3 grid grid-cols-1 md:grid-cols-3 gap-3'>
        <div className='md:col-span-2'>
          <label className='block text-sm text-gray-700 mb-1'>
            보낼 메시지
          </label>
          <input
            type='text'
            value={text}
            onChange={(e) => setText(e.target.value)}
            className='w-full border rounded px-3 py-2 text-sm'
            placeholder='예: 안녕하세요!'
          />
        </div>
        <div className='flex items-end'>
          <button
            type='button'
            className='btn-primary w-full'
            onClick={handleSend}
            disabled={!roomId || !text || state !== ConnectionState.CONNECTED}>
            전송
          </button>
        </div>
      </div>

    </div>
  );
};

export default WsDebugPanel;
