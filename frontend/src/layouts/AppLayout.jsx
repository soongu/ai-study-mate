import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import ToastProvider from '../components/toast/ToastProvider.jsx';
import { useAuthStore } from '../stores/authStore.js';
import {
  connectSSE,
  disconnectSSE,
  requestNotificationPermission,
} from '../services/notificationService.js';

const AppLayout = () => {
  const { isAuthenticated, user, fetchMe } = useAuthStore();

  useEffect(() => {
    // SNS 로그인 후 /app으로 들어오면 쿠키만 세팅되어 있는 상태이므로
    // 최초 진입 시 서버에서 사용자 정보를 가져와 스토어를 채웁니다.
    if (!isAuthenticated || !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  // 🔔 SSE 알림 시스템 초기화
  useEffect(() => {
    // 사용자가 인증되었을 때만 SSE 연결
    if (isAuthenticated && user) {
      console.log('🔗 사용자 인증됨 - SSE 연결 시작');

      // 브라우저 알림 권한 요청 (사용자 동의 필요)
      requestNotificationPermission().then((granted) => {
        if (granted) {
          console.log('✅ 브라우저 알림 권한 허용됨');
        } else {
          console.log('⚠️ 브라우저 알림 권한 거부됨 (SSE는 여전히 동작)');
        }
      });

      // SSE 연결 시작
      connectSSE();

      // 컴포넌트 언마운트 시 연결 정리
      return () => {
        console.log('🔌 컴포넌트 언마운트 - SSE 연결 종료');
        disconnectSSE();
      };
    } else {
      // 인증되지 않은 상태라면 SSE 연결 종료
      disconnectSSE();
    }
  }, [isAuthenticated, user]); // 인증 상태가 변경될 때마다 실행

  return (
    <ToastProvider>
      <div className='min-h-screen flex flex-col'>
        <AppHeader />

        <main className='flex-1'>
          <Outlet />
        </main>

        <AppFooter />
      </div>
    </ToastProvider>
  );
};

export default AppLayout;
