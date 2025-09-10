// 라우트 설정 - 데이터 방식 사용
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import StudyRoomList from './pages/StudyRoomList.jsx';
import RoomDetail from './pages/RoomDetail.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { loginLoader } from './loaders/authLoaders.js';
import PrivateRoute from './components/auth/PrivateRoute.jsx';

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
      { index: true, element: <Dashboard /> },
      { path: 'rooms', element: <StudyRoomList /> },
      { path: 'rooms/:id', element: <RoomDetail /> },
    ],
  },
]);

export default router;
