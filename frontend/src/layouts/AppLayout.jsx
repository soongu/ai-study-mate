import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';
import { useAuthStore } from '../stores/authStore.js';

const AppLayout = () => {
  const { isAuthenticated, user, fetchMe } = useAuthStore();

  useEffect(() => {
    // SNS 로그인 후 /app으로 들어오면 쿠키만 세팅되어 있는 상태이므로
    // 최초 진입 시 서버에서 사용자 정보를 가져와 스토어를 채웁니다.
    if (!isAuthenticated || !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  return (
    <div className='min-h-screen flex flex-col'>
      <AppHeader />

      <main className='flex-1'>
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
};

export default AppLayout;
