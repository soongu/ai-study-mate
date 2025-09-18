import apiClient from './apiClient';

// 공통 에러 정규화: Axios/네트워크/서버 에러를 일관된 형태로 반환
const normalizeError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  return {
    status: status ?? 'NETWORK',
    message: data?.message || data?.error || error?.message || 'Unknown error',
    details: data || null,
  };
};

export const AIService = {
  // 코드 리뷰 요청 (백엔드 구현 후 경로 확정 예정)
  async reviewCode({ language, code, context }) {
    try {
      const res = await apiClient.post('/ai/code-review', {
        language,
        code,
        context: context ?? null,
      });
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  // 질문 답변 요청
  async askQuestion({ question, context }) {
    try {
      const res = await apiClient.post('/ai/question', {
        question,
        context: context ?? null,
      });
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  // 최근 히스토리 조회
  async getHistory({ limit = 10 } = {}) {
    try {
      const res = await apiClient.get('/ai/history', { params: { limit } });
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },
};

export default AIService;
