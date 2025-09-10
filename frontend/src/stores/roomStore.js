import { create } from 'zustand';

// RoomStore: 스터디룸 관련 전역 상태
// - rooms: 목록 데이터
// - selectedRoomId: 선택된 룸 ID (상세/참여에 사용)
// - participantsByRoomId: 참여자 목록 캐시
// - actions: 목록 세팅/추가/선택/참여자 세팅
export const useRoomStore = create((set) => ({
  // state
  rooms: [],
  selectedRoomId: null,
  // participantsByRoomId: 참여자 목록 캐시
  // - 같은 방 상세/탭 전환 시 매번 API를 호출하지 않도록 네트워크 비용을 줄입니다.
  // - 스켈레톤/깜빡임을 줄여 체감 속도를 높이고 UX를 개선합니다.
  // - 무결성: join/leave 성공 시 setParticipants로 즉시 반영하고,
  //   필요 시 백엔드 강제 새로고침 API로 재동기화합니다.
  participantsByRoomId: {}, // { [roomId]: Participant[] }

  // actions
  // setRooms: 서버에서 받은 전체 목록을 통째로 교체합니다.
  setRooms: (rooms) => set({ rooms }),
  // addRoomToTop: 새로 생성된 방을 목록 최상단에 추가합니다. (불변성 유지)
  addRoomToTop: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),
  // appendRooms: 페이징/무한스크롤에서 기존 목록 뒤에 이어 붙입니다.
  appendRooms: (moreRooms) =>
    set((state) => ({ rooms: [...state.rooms, ...moreRooms] })),
  // selectRoom: 상세/참여 액션에서 사용할 선택된 방 ID를 저장합니다.
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),
  // setParticipants: 특정 roomId의 참여자 목록 캐시를 갱신합니다.
  // - 동일 화면 재방문 시 재요청을 최소화하여 렌더링 성능과 일관성을 확보합니다.
  // - 참여/나가기 액션 직후 화면을 즉시 최신 상태로 보여줍니다.
  setParticipants: (roomId, participants) =>
    set((state) => ({
      participantsByRoomId: {
        ...state.participantsByRoomId,
        [roomId]: participants,
      },
    })),
}));

export default useRoomStore;
