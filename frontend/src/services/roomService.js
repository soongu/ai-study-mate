import apiClient from './apiClient';

export const RoomService = {
  createRoom: (payload) =>
    apiClient.post('/rooms', payload).then(({ data }) => data),
};
