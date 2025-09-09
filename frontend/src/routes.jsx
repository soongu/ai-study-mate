// 라우트 설정 - 데이터 방식 사용
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { loginLoader } from './loaders/authLoaders.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />, // 최초 진입은 로그인 화면
    loader: loginLoader,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [{ index: true, element: <App /> }],
  },
]);

export default router;
