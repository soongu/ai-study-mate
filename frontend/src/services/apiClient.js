import axios from 'axios';

// Axios 기본 설정
const apiClient = axios.create({
  baseURL: '/api', // Vite 프록시 사용
  withCredentials: true, // HTTP-Only 쿠키 지원
});

export default apiClient;
