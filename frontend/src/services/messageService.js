import apiClient from './apiClient';

/**
 * MessageService: 채팅 메시지 REST 호출(최근 메시지)
 */
export const MessageService = {
  /**
   * 최근 메시지 조회
   * @param {number} roomId
   * @param {number} page
   * @param {number} size
   * @returns {Promise<Array<{id:number, roomId:number, senderId:number, senderNickname:string, content:string, createdAt:string}>>}
   */
  async getRecent(roomId, page = 0, size = 20) {
    const res = await apiClient.get(`/rooms/${roomId}/messages`, {
      params: { page, size },
    });
    return res?.data?.data || [];
  },
};
