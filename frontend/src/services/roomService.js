import apiClient from './apiClient';

export const RoomService = {
  // ApiResponse<T>에서 data만 추출해 반환합니다.
  createRoom: (payload) =>
    apiClient.post('/rooms', payload).then(({ data }) => data?.data),
  // 목록 조회: ApiResponse<Page<StudyRoomListItemResponse>> → 도메인/페이지 정보로 변환
  listRooms: ({ page = 0, size = 12, keyword, hostId } = {}) =>
    apiClient
      .get('/rooms', { params: { page, size, keyword, hostId } })
      .then(({ data }) => data?.data)
      .then((pageData) => ({
        items: (pageData?.content || []).map((it) => ({
          id: it.id,
          title: it.title,
          description: it.description,
          participantsCount: it.participantCount ?? 0,
          maxParticipants: 4,
        })),
        pageInfo: {
          page: pageData?.number ?? page,
          size: pageData?.size ?? size,
          totalElements: pageData?.totalElements ?? 0,
          totalPages: pageData?.totalPages ?? 0,
        },
      })),
  // 상세 조회: ApiResponse<StudyRoomDetailResponse>
  getRoomDetail: (roomId) =>
    apiClient.get(`/rooms/${roomId}`).then(({ data }) => data?.data),
  // 참여: ApiResponse<JoinLeaveResponse>
  joinRoom: (roomId) =>
    apiClient
      .post(`/rooms/${roomId}/join`, { roomId })
      .then(({ data }) => data?.data),
  // 나가기: ApiResponse<JoinLeaveResponse>
  leaveRoom: (roomId) =>
    apiClient
      .delete(`/rooms/${roomId}/leave`, { data: { roomId } })
      .then(({ data }) => data?.data),
};
