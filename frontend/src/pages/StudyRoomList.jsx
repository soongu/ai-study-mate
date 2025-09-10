// 스터디룸 목록 페이지
// - 목록 그리드 UI 표시
// - 로딩 중에는 스켈레톤 노출
// - 비어있으면 빈 상태 메시지 노출
// - "방 만들기" 모달로 생성 플로우 제공
import React, { useEffect, useState } from 'react';
import RoomCard from '../components/RoomCard.jsx';
import RoomListSkeleton from '../components/RoomListSkeleton.jsx';
import CreateRoomModal from '../components/CreateRoomModal.jsx';
import { RoomService } from '../services/roomService.js';
import { useRoomStore } from '../stores/roomStore.js';
import { useToast } from '../components/toastContext.js';

// 임시 데이터 (백엔드 연동 전)
// 실제로는 백엔드의 GET /api/rooms 결과를 사용합니다.
// 각 항목은 카드에 필요한 최소 정보(title, description, 인원 수)를 포함합니다.
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
  // UI 상태
  // - loading: 초기 데이터 로딩 여부
  // - rooms: 스터디룸 목록 데이터
  // - modalOpen: 생성 모달 열림/닫힘
  // - submitting: 생성 요청 진행 중 여부
  // - submitError: 생성 실패 시 에러 메시지
  const [loading, setLoading] = useState(true);
  // 전역 Store: rooms 목록과 세팅/추가 액션 사용
  const rooms = useRoomStore((s) => s.rooms);
  const setRooms = useRoomStore((s) => s.setRooms);
  const addRoomToTop = useRoomStore((s) => s.addRoomToTop);
  const appendRooms = useRoomStore((s) => s.appendRooms);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 검색/페이지네이션/토스트 상태
  const [keyword, setKeyword] = useState(''); // 입력값
  const [debouncedKeyword, setDebouncedKeyword] = useState(''); // 디바운싱 확정값
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const { show: showToast } = useToast();

  // 모달 닫기 핸들러 (onClose에 바인딩)
  const handleCloseModal = () => {
    // 오버레이/닫기 버튼/ESC로 닫힐 때
    // 제출 중이면 닫지 않도록 방지합니다.
    if (!submitting) {
      setModalOpen(false);
      setSubmitError('');
    }
  };

  // 방 생성 제출 핸들러 (onSubmit에 바인딩)
  const handleCreateRoomSubmit = async ({ title, description }) => {
    // 생성 버튼 클릭 시 호출되는 제출 핸들러
    // 1) 제출 상태로 전환 → 버튼 비활성화/텍스트 변경
    // 2) RoomService.createRoom 호출로 서버에 방 생성 요청
    // 3) 성공 시: 모달 닫고 목록 상단에 새 카드 추가 (임시 UX)
    //    - 서비스가 ApiResponse<T>에서 data만 반환하므로 res가 도메인 데이터입니다.
    // 4) 실패 시: 모달 내부에 에러 메시지 표시
    try {
      setSubmitting(true);
      setSubmitError('');
      const res = await RoomService.createRoom({ title, description });
      // 성공 시: 모달 닫고 전역 Store 목록 상단에 추가(임시)
      addRoomToTop({
        id: res?.id || Math.random(),
        title: res?.title || title,
        description: res?.description || description,
        participantsCount: res?.participantsCount ?? 1,
        maxParticipants: res?.maxParticipants ?? 4,
      });
      // 성공 토스트 노출
      showToast('방이 생성되었습니다.', {
        type: 'success',
        position: 'top-center',
      });
      setModalOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.message || '방 생성에 실패했습니다.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 디바운싱: 입력 후 700ms 지나면 확정 키워드로 반영
  useEffect(() => {
    setIsDebouncing(true);
    const t = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setIsDebouncing(false);
    }, 700);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    // 초기 로드 및 확정 키워드 변경 시 첫 페이지 로드
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const { items, pageInfo } = await RoomService.listRooms({
          page: 0,
          size: 12,
          keyword: debouncedKeyword,
        });
        setRooms(items);
        setPage(pageInfo.page);
        setTotalPages(pageInfo.totalPages);
      } catch {
        // 실패 시: 최소한의 UX를 위해 기존 목데이터를 표시
        setRooms(mockRooms);
        setPage(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [setRooms, debouncedKeyword]);

  return (
    <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* 검색 바 (실시간 검색 + 디바운싱 표시) */}
        <div className='mb-4'>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='방 제목 검색'
            className='input-field w-full'
          />
        </div>
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
            className='btn-primary'
            // 모달 열기 버튼: 클릭 시 생성 모달을 오픈합니다.
            onClick={() => setModalOpen(true)}>
            방 만들기
          </button>
        </div>

        {loading || isDebouncing ? (
          // 1) 로딩 상태: 스켈레톤 카드 그리드 노출
          <RoomListSkeleton count={8} />
        ) : rooms.length === 0 ? (
          // 2) 빈 상태: 생성 유도 문구
          <div className='text-center py-20'>
            <p className='text-gray-600'>
              아직 생성된 스터디룸이 없어요. 첫 방의 주인이 되어보세요!
            </p>
          </div>
        ) : (
          // 3) 정상 목록: 카드 그리드 렌더링
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                title={room.title}
                description={room.description}
                participantsCount={room.participantsCount}
                maxParticipants={room.maxParticipants}
                // 카드 클릭 시 상세 페이지로 이동하도록 훗날 연결 예정
                onClick={() => {}}
              />
            ))}
          </div>
        )}
        {/* 더 보기 */}
        {!loading && rooms.length > 0 && page + 1 < totalPages && (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              className='btn-primary disabled:opacity-60'
              disabled={loadingMore}
              onClick={async () => {
                if (loadingMore) return;
                const next = page + 1;
                if (totalPages && next >= totalPages) return;
                try {
                  setLoadingMore(true);
                  const { items, pageInfo } = await RoomService.listRooms({
                    page: next,
                    size: 12,
                    keyword: debouncedKeyword,
                  });
                  appendRooms(items);
                  setPage(pageInfo.page);
                  setTotalPages(pageInfo.totalPages);
                } catch {
                  // 네트워크 에러 발생 시 토스트로 안내
                  showToast(
                    '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                    { type: 'error' }
                  );
                } finally {
                  setLoadingMore(false);
                }
              }}>
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
      {/* 전역 ToastProvider에서 렌더링됨 */}
      <CreateRoomModal
        open={modalOpen}
        onClose={handleCloseModal}
        submitting={submitting}
        errorMessage={submitError}
        onSubmit={handleCreateRoomSubmit}
      />
    </div>
  );
};

export default StudyRoomList;
