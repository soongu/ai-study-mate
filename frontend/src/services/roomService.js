import apiClient from './apiClient';

export const RoomService = {
  // ApiResponse<T>에서 data만 추출해 반환합니다.
  createRoom: (payload) => apiClient.post('/rooms', payload).then(({ data }) => data?.data),
};
