// 라우트 설정 - 데이터 방식 사용
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import StudyRoomList from './pages/StudyRoomList.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { loginLoader } from './loaders/authLoaders.js';
import PrivateRoute from './components/PrivateRoute.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />, // 최초 진입은 로그인 화면
    loader: loginLoader,
  },
  {
    path: '/app',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <App /> },
      { path: 'rooms', element: <StudyRoomList /> },
    ],
  },
]);

export default router;
