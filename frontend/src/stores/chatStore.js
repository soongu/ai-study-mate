import { create } from 'zustand';

/**
 * ChatStore (Zustand)
 *
 * 왜 전역 상태인가?
 * - 동일한 "방 메시지"를 여러 UI에서 공유하기 위해: 채팅 리스트, 상단 알림/배지, 다른 패널 등.
 * - 연결/재연결·컴포넌트 리렌더에도 일관된 상태 유지: 화면이 잠시 닫혔다 다시 열려도 직전 상태를 복구하기 쉽습니다.
 * - 구독(Subscribe)/해제(Unsubscribe) 부작용을 한 곳에서 관리: 메시지 추가/정리 정책을 중앙화합니다.
 * - 메모리/성능: 패널 닫힘 시 `clearRoom(roomId)`로 불필요한 히스토리를 정리(선택)할 수 있습니다.
 *
 * 중복 처리 정책(핵심)
 * - "중복"은 서버에서 부여한 메시지 고유 id를 기준으로만 판단합니다.
 *   - 즉, 내용이 같아도 id가 다르면 서로 다른 메시지로 저장합니다(의도적 중복 전송 허용).
 *   - 반대로, 네트워크 사유로 동일 메시지가 중복 수신되더라도 같은 id면 한 번만 보관됩니다.
 * - 시스템 메시지(JOIN/LEAVE 등)는 클라이언트에서 `sys-타임스탬프` 형태의 임시 id를 부여합니다(충돌 극히 낮음).
 *
 * 구조
 * - messagesByRoomId: { [roomId: number]: Array<Message> }
 * - messageIdSetByRoomId: { [roomId: number]: Set<string> } // id 중복 체크용
 */
export const useChatStore = create((set) => ({
  messagesByRoomId: {},
  messageIdSetByRoomId: {},

  /** 방 메시지를 초기 세팅(교체)합니다. id가 있는 항목만 set에 반영합니다. */
  setInitialMessages: (roomId, messages) =>
    set((state) => {
      const idSet = new Set();
      for (const m of messages) {
        const id = m?.id != null ? String(m.id) : null;
        if (id) idSet.add(id);
      }
      return {
        messagesByRoomId: {
          ...state.messagesByRoomId,
          [roomId]: messages || [],
        },
        messageIdSetByRoomId: {
          ...state.messageIdSetByRoomId,
          [roomId]: idSet,
        },
      };
    }),

  /**
   * 단일 메시지를 추가합니다.
   * - id가 존재하고 이미 본 적 있으면 무시(네트워크 중복 수신 방지)
   * - 내용이 같더라도 id가 다르면 다른 메시지로 간주(의도적 중복 전송 허용)
   */
  appendIfNew: (roomId, message) =>
    set((state) => {
      const id = message?.id != null ? String(message.id) : null;
      const curList = state.messagesByRoomId[roomId] || [];
      const curSet = state.messageIdSetByRoomId[roomId] || new Set();
      if (id && curSet.has(id)) {
        return state; // 중복 방지
      }
      const nextList = [...curList, message];
      const nextSet = new Set(curSet);
      if (id) nextSet.add(id);
      return {
        messagesByRoomId: { ...state.messagesByRoomId, [roomId]: nextList },
        messageIdSetByRoomId: {
          ...state.messageIdSetByRoomId,
          [roomId]: nextSet,
        },
      };
    }),

  /** 방 메시지 상태를 초기화합니다. */
  clearRoom: (roomId) =>
    set((state) => {
      const nextMsgs = { ...state.messagesByRoomId };
      const nextIds = { ...state.messageIdSetByRoomId };
      delete nextMsgs[roomId];
      delete nextIds[roomId];
      return { messagesByRoomId: nextMsgs, messageIdSetByRoomId: nextIds };
    }),
}));
