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
} from '../../services/websocketService.js';

const badgeClass = (state) => {
  if (state === ConnectionState.CONNECTED)
    return 'bg-green-50 text-green-700 border-green-200';
  if (state === ConnectionState.CONNECTING)
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const WsDebugPanel = () => {
  // 현재 연결 상태를 화면에 보여주기 위한 로컬 상태
  const [state, setState] = useState(getWsState());

  useEffect(() => {
    // 연결 상태가 바뀔 때마다 로컬 상태를 갱신해 배지를 업데이트
    setOnStateChange(setState);
  }, []);

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
    </div>
  );
};

export default WsDebugPanel;
