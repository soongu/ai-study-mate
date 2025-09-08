import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /**
   * Vite 설정 안내
   *
   * - plugins: React 플러그인 적용 (JSX, Fast Refresh 등 지원)
   * - server.proxy:
   *    - '/api'로 시작하는 프론트엔드 요청을 백엔드 서버(http://localhost:9005)로 프록시
   *    - changeOrigin: 백엔드 서버에 요청 시 origin 헤더를 백엔드 주소로 변경
   *    - rewrite: '/api' 접두사를 제거하여 실제 백엔드 엔드포인트와 맞춤
   * - server.port: 개발 서버 포트 3000번 사용
   *
   * ※ 이 설정으로 CORS 문제 없이 프론트엔드에서 백엔드 API 호출 가능
   */
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
