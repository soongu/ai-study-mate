import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, hasCheckedAuth, fetchMe } = useAuthStore();
  const [forceSplash, setForceSplash] = useState(false);
  const [progress, setProgress] = useState(0);

  const splashTimer = useRef(null);
  const rafRef = useRef(null);
  const intervalRef = useRef(null);

  // 최초 진입 시 인증 체크 1회
  useEffect(() => {
    if (!hasCheckedAuth) {
      fetchMe();
    }
  }, [hasCheckedAuth, fetchMe]);

  // 방금 로그인 버튼을 눌러 들어온 경우라면, 1.5초간 로딩 화면을 보여줘요
  useEffect(() => {
    const flag = sessionStorage.getItem('justLoggedIn');
    if (flag === '1') {
      setForceSplash(true);
      splashTimer.current = setTimeout(() => {
        setForceSplash(false);
        sessionStorage.removeItem('justLoggedIn');
      }, 1500);
    }
    return () => {
      if (splashTimer.current) clearTimeout(splashTimer.current);
    };
  }, []);

  const isFallbackActive = forceSplash || !hasCheckedAuth || loading;

  // 진행바 애니메이션: 스플래시(1.5초)는 0→100%, 일반 로딩은 90%까지 서서히
  useEffect(() => {
    // 정리 함수
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    if (!isFallbackActive) {
      cleanup();
      setProgress(0);
      return;
    }

    setProgress(0);

    if (forceSplash) {
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const pct = Math.min(100, (elapsed / 1000) * 100);
        setProgress(pct);
        if (pct < 100) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    } else {
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : Math.min(90, p + 5)));
      }, 120);
    }

    return cleanup;
  }, [isFallbackActive, forceSplash]);

  if (isFallbackActive) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='w-full max-w-sm px-6'>
          <div className='mb-4 text-center'>
            <div className='text-lg font-semibold text-gray-800'>
              AI Study Mate
            </div>
            <div className='text-sm text-gray-500 mt-1'>
              잠시만 기다려주세요...
            </div>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200 overflow-hidden'>
            <div
              className='h-full bg-indigo-500 transition-all ease-out duration-150'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to='/'
        replace
      />
    );
  }

  return children;
};

export default PrivateRoute;
