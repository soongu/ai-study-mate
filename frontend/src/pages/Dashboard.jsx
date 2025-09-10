import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { RoomService } from '../services/roomService.js';
import RoomListGrid from '../components/room/RoomListGrid.jsx';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const me = useAuthStore((s) => s.user);
  const refreshMeSilent = useAuthStore((s) => s.refreshMeSilent);
  const refreshMeSilentRef = useRef(refreshMeSilent);
  useEffect(() => {
    // 최신 refreshMeSilent 참조 유지
    refreshMeSilentRef.current = refreshMeSilent;
  }, [refreshMeSilent]);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const didInitRef = useRef(false);
  useEffect(() => {
    // StrictMode에서도 1회만 실행 보장
    if (didInitRef.current) return;
    didInitRef.current = true;

    // 대시보드 진입 시 조용히 내 정보 갱신 → 참여한 방 개수 최신화
    refreshMeSilentRef.current?.();

    const load = async () => {
      try {
        setLoading(true);
        const { items } = await RoomService.listRooms({ page: 0, size: 8 });
        setRooms(items);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
              대시보드
            </h1>
            <p className='mt-1 text-sm text-gray-600'>
              반가워요, {me?.nickname || '스터디어'} 님 👋
            </p>
          </div>
          <button
            type='button'
            className='btn-primary'
            onClick={() => navigate('/app/rooms')}>
            스터디룸 보러가기
          </button>
        </div>

        {/* 통계 카드 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
          <div className='card'>
            <p className='text-sm text-gray-500'>누적 학습 시간</p>
            <p className='mt-1 text-2xl font-semibold text-gray-900'>
              {me?.totalStudyTime ?? 0}분
            </p>
          </div>
          <div className='card'>
            <p className='text-sm text-gray-500'>참여한 스터디룸</p>
            <p className='mt-1 text-2xl font-semibold text-gray-900'>
              {me?.studyRoomCount ?? 0}개
            </p>
          </div>
          <div className='card'>
            <p className='text-sm text-gray-500'>오늘의 목표</p>
            <p className='mt-1 text-2xl font-semibold text-gray-900'>
              꾸준함 유지하기 ✅
            </p>
          </div>
        </div>

        {/* 추천 스터디룸 */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>추천 스터디룸</h2>
          <button
            type='button'
            className='text-sm text-gray-600 hover:text-gray-900'
            onClick={() => navigate('/app/rooms')}>
            더 보기 →
          </button>
        </div>
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className='card h-24 animate-pulse'
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className='text-sm text-gray-600'>
            추천할 스터디룸이 아직 없어요.
          </div>
        ) : (
          <RoomListGrid
            rooms={rooms}
            onCardClick={(room) => navigate(`/app/rooms/${room.id}`)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
