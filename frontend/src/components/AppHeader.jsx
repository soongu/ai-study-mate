import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AppHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    // replace: true 옵션은 navigate 함수가 현재 히스토리 스택의 마지막(즉, 현재 페이지)을 새로운 경로로 "대체"하도록 만듭니다.
    // 즉, 뒤로가기를 눌렀을 때 로그아웃 전 페이지로 돌아가지 않게 하려면 replace: true를 사용합니다.
    navigate('/', { replace: true });
  };

  return (
    <header className='border-b bg-white'>
      <div className='container mx-auto px-4 h-14 flex items-center justify-between'>
        <Link
          to='/app'
          className='text-lg font-semibold text-gray-900'>
          AI Study Mate
        </Link>
        <nav className='flex items-center gap-4 text-sm text-gray-600'>
          <Link
            to='/app'
            className='hover:text-gray-900'>
            홈
          </Link>
          {isAuthenticated && (
            <>
              {user?.nickname && (
                <span className='hidden sm:inline text-gray-500'>
                  안녕하세요, {user.nickname}님
                </span>
              )}
              <button
                type='button'
                onClick={handleLogout}
                className='btn-secondary py-1.5 px-3'>
                로그아웃
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
