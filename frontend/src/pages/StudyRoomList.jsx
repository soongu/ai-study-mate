import React, { useEffect, useState } from 'react';
import RoomCard from '../components/RoomCard.jsx';
import RoomListSkeleton from '../components/RoomListSkeleton.jsx';

// 임시 데이터 (백엔드 연동 전)
const mockRooms = [
  {
    id: 1,
    title: '알고리즘 스터디',
    description: '매일 아침 1문제 풀이! 같이 성장해요.',
    participantsCount: 3,
    maxParticipants: 4,
  },
  {
    id: 2,
    title: 'CS 전공기초 복습',
    description: '운영체제/네트워크/자료구조 정리',
    participantsCount: 4,
    maxParticipants: 4,
  },
  {
    id: 3,
    title: '영어 리딩 스터디',
    description: '기술 블로그 함께 읽고 공유',
    participantsCount: 2,
    maxParticipants: 4,
  },
];

const StudyRoomList = () => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // 초기 로딩 스켈레톤 표시 후, 임시 데이터 주입
    const t = setTimeout(() => {
      setRooms(mockRooms);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
              스터디룸
            </h1>
            <p className='mt-1 text-sm text-gray-600'>
              최대 4명까지 함께 공부해요.
            </p>
          </div>
          <button
            type='button'
            className='btn-primary'>
            방 만들기
          </button>
        </div>

        {loading ? (
          <RoomListSkeleton count={8} />
        ) : rooms.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-gray-600'>
              아직 생성된 스터디룸이 없어요. 첫 방의 주인이 되어보세요!
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                title={room.title}
                description={room.description}
                participantsCount={room.participantsCount}
                maxParticipants={room.maxParticipants}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyRoomList;
