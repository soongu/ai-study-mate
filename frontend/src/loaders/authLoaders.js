import { redirect } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// 첫 진입에서 불필요한 서버 호출을 피하기 위해
// 스토어에 저장된 인증 여부만 보고 분기합니다.
// - isAuthenticated === true 이면 바로 /app 으로 이동
// - 아니면 로그인 페이지 그대로 렌더 (서버 요청 없음)
export const loginLoader = async () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    return redirect('/app');
  }
  return null;
};
