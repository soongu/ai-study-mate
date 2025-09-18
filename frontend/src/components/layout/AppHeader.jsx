import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import {
  getSSEStatus,
  addSSEListener,
  removeSSEListener,
} from '../../services/notificationService.js';
import useHistoryStore from '../../stores/historyStore.js';

const AppHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openPanel } = useHistoryStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [sseStatus, setSseStatus] = useState(getSSEStatus());
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // 🔔 SSE 상태 업데이트 리스너 등록
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateStatus = () => {
      setSseStatus(getSSEStatus());
    };

    // SSE 이벤트 리스너 등록
    const connectedListenerId = addSSEListener('connected', updateStatus);
    const errorListenerId = addSSEListener('error', updateStatus);
    const heartbeatListenerId = addSSEListener('heartbeat', updateStatus);

    // 주기적 상태 업데이트
    const interval = setInterval(updateStatus, 5000);

    return () => {
      removeSSEListener('connected', connectedListenerId);
      removeSSEListener('error', errorListenerId);
      removeSSEListener('heartbeat', heartbeatListenerId);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const avatarUrl = user?.profileImageUrl || undefined;
  const nickname = user?.nickname || '사용자';

  const computeUseNoReferrer = (url) => {
    if (!url) return false;
    const u = url.toLowerCase();
    const isGoogle = u.includes('googleusercontent') || u.includes('gstatic');
    const isKakao = u.includes('kakao');
    if (isKakao) return false; // kakao는 referrer/cors 옵션 없이 렌더링이 더 안정적
    if (isGoogle) return true; // google은 no-referrer가 필요한 경우가 있음
    return false;
  };

  const [useNoReferrer, setUseNoReferrer] = useState(
    computeUseNoReferrer(avatarUrl)
  );

  // 프로필 변경 시 상태 초기화 및 정책 재계산
  useEffect(() => {
    setImgFailed(false);
    setUseNoReferrer(computeUseNoReferrer(avatarUrl));
  }, [avatarUrl]);

  const handleImgError = () => {
    // 우선 옵션을 제거해 재시도. 그래도 실패하면 폴백으로 이니셜 표시
    if (useNoReferrer) {
      setUseNoReferrer(false);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-gray-200/60 `}>
      <div className='container mx-auto px-4 h-16 lg:h-20 flex items-center justify-between'>
        <Link
          to='/app'
          className='text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 select-none'>
          AI Study Mate
        </Link>

        <nav className='flex items-center gap-4 md:gap-5 text-sm'>
          <Link
            to='/app'
            className='hidden sm:inline text-gray-600 hover:text-gray-900 rounded-md px-3 py-2 transition-colors hover:bg-gray-100'>
            홈
          </Link>
          <Link
            to='/app/rooms'
            className='hidden sm:inline text-gray-600 hover:text-gray-900 rounded-md px-3 py-2 transition-colors hover:bg-gray-100'>
            스터디룸
          </Link>
          <button
            type='button'
            onClick={openPanel}
            className='hidden sm:inline text-gray-600 hover:text-gray-900 rounded-md px-3 py-2 transition-colors hover:bg-gray-100'
            aria-label='히스토리 열기'>
            히스토리
          </button>

          {/* 🔔 SSE 연결 상태 표시 (인증된 사용자만) */}
          {isAuthenticated && (
            <div className='flex items-center'>
              <div
                className={`w-2 h-2 rounded-full ${
                  sseStatus.isConnected
                    ? 'bg-green-500'
                    : sseStatus.reconnectAttempts > 0
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
                }`}
                title={
                  sseStatus.isConnected
                    ? '실시간 알림 연결됨'
                    : sseStatus.reconnectAttempts > 0
                    ? `재연결 중... (${sseStatus.reconnectAttempts}/${sseStatus.maxReconnectAttempts})`
                    : '실시간 알림 연결 안됨'
                }
              />
            </div>
          )}

          {isAuthenticated && (
            <div
              ref={menuRef}
              className='relative'>
              <button
                type='button'
                onClick={() => setMenuOpen((v) => !v)}
                className='flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow transition'>
                <div className='w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center'>
                  {avatarUrl && !imgFailed ? (
                    <img
                      key={`${useNoReferrer ? 'nr' : 'std'}-${avatarUrl}`}
                      src={avatarUrl}
                      alt='avatar'
                      className='w-full h-full object-cover'
                      {...(useNoReferrer
                        ? {
                            referrerPolicy: 'no-referrer',
                            crossOrigin: 'anonymous',
                          }
                        : {})}
                      onError={handleImgError}
                      loading='lazy'
                    />
                  ) : (
                    <span className='text-sm text-gray-600'>
                      {nickname.charAt(0)}
                    </span>
                  )}
                </div>
                <span className='hidden sm:inline text-gray-700 font-medium'>
                  {nickname}
                </span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  className='w-4 h-4 text-gray-500'>
                  <path
                    fillRule='evenodd'
                    d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className='absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden'>
                  <div className='px-4 py-3 border-b bg-gray-50'>
                    <div className='text-xs text-gray-500'>로그인됨</div>
                    <div className='text-sm font-semibold text-gray-800 truncate'>
                      {nickname}
                    </div>
                  </div>
                  <div className='py-1'>
                    <Link
                      to='/app'
                      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                      대시보드
                    </Link>
                    <Link
                      to='/app/rooms'
                      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                      스터디룸
                    </Link>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'>
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
