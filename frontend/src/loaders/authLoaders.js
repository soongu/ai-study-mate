import { redirect } from 'react-router-dom';
import apiClient from '../services/apiClient';

export const loginLoader = async () => {
  try {
    const res = await apiClient.get('/users/me');
    if (res?.data?.success) {
      return redirect('/app');
    }
  } catch (_) {
    // 미인증이면 그대로 진행
  }
  return null;
};
