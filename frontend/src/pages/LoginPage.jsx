import React from 'react';
import { getOAuthUrl } from '../utils/auth';

const setJustLoggedInFlag = () => {
  try {
    sessionStorage.setItem('justLoggedIn', '1');
  } catch {
    // ignore storage errors
  }
};

const LoginPage = () => {
  return (
    <div
      className='min-h-screen w-full relative overflow-hidden'
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2024/05/28/13/43/lofi-8793825_1280.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      {/* 그라디언트 오버레이 (조금 더 밝게) */}
      <div className='absolute inset-0 bg-black/30' />

      {/* 콘텐츠 영역 */}
      <div className='relative z-10 min-h-screen flex items-center justify-center px-4'>
        <div className='w-full max-w-md rounded-2xl p-8 shadow-2xl border border-white/20 bg-white/50 backdrop-blur-sm animate-fade-in animate-slide-up'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>AI Study Mate</h1>
            <p className='text-gray-700 mt-2'>소셜 로그인으로 시작하세요</p>
          </div>

          <div className='space-y-3'>
            <a
              href={getOAuthUrl('google')}
              onClick={setJustLoggedInFlag}
              className='w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-200/70 bg-white/70 hover:bg-white transition-colors'>
              <img
                src='https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
                alt='google'
                className='w-5 h-5'
              />
              <span className='text-gray-800 font-medium'>Google로 로그인</span>
            </a>

            <a
              href={getOAuthUrl('kakao')}
              onClick={setJustLoggedInFlag}
              className='w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg'
              style={{ backgroundColor: '#FEE500' }}>
              <img
                src='https://developers.kakao.com/tool/resource/static/img/button/login/full/ko/kakao_login_medium_narrow.png'
                alt='kakao'
                className='w-5 h-5 object-contain'
              />
              <span className='text-gray-900 font-medium'>Kakao로 로그인</span>
            </a>
          </div>

          <p className='text-xs text-gray-600 mt-6 text-center'>
            로그인 시 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
