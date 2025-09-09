import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Axios 기본 설정
const apiClient = axios.create({
  baseURL: '/api', // Vite 프록시 사용
  withCredentials: true, // HTTP-Only 쿠키 지원
});

// Request 인터셉터 (필요 시 헤더 추가 등 확장 용도)
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response 인터셉터: 401 처리
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        // 인증 만료 → 전역 상태 초기화
        const { clear } = useAuthStore.getState();
        clear();
      } catch (_) {
        // noop
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
