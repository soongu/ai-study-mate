import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomService } from '../services/roomService.js';
import { useRoomStore } from '../stores/roomStore.js';
import { useToast } from '../components/toast/toastContext.js';

const RoomDetail = () => {
  const { id } = useParams();
  const roomId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  const updateRoomParticipantsCount = useRoomStore(
    (s) => s.updateRoomParticipantsCount
  );
  const participantsCache = useRoomStore((s) => s.participantsByRoomId);
  const setParticipants = useRoomStore((s) => s.setParticipants);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const cachedParticipants = participantsCache[roomId] || [];

  useEffect(() => {
    let ignore = false;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const d = await RoomService.getRoomDetail(roomId);
        if (!ignore) {
          setDetail(d);
        }
        // 참여자 캐시가 없으면 로드 시도 (백엔드 준비 전에는 빈 배열 처리)
        if (!participantsCache[roomId]) {
          const list = await RoomService.getParticipants(roomId);
          setParticipants(roomId, list);
        }
      } catch {
        showToast('방 정보를 불러오지 못했습니다.', { type: 'error' });
        navigate('/app/rooms');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    if (Number.isFinite(roomId)) {
      fetchDetail();
    } else {
      navigate('/app/rooms');
    }
    return () => {
      ignore = true;
    };
  }, [roomId, navigate, showToast, setParticipants, participantsCache]);

  const handleJoin = async () => {
    if (joining) return;
    try {
      setJoining(true);
      await RoomService.joinRoom(roomId);
      const newCount = (detail?.participantCount ?? 0) + 1;
      setDetail((prev) => ({ ...prev, participantCount: newCount }));
      updateRoomParticipantsCount(roomId, newCount);
      // 캐시 동기화 (간단히 재조회)
      const list = await RoomService.getParticipants(roomId);
      setParticipants(roomId, list);
      showToast('방에 참여했어요.', { type: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || '참여에 실패했습니다.';
      showToast(msg, { type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (leaving) return;
    try {
      setLeaving(true);
      await RoomService.leaveRoom(roomId);
      const newCount = Math.max((detail?.participantCount ?? 1) - 1, 0);
      setDetail((prev) => ({ ...prev, participantCount: newCount }));
      updateRoomParticipantsCount(roomId, newCount);
      const list = await RoomService.getParticipants(roomId);
      setParticipants(roomId, list);
      showToast('방에서 나왔어요.', { type: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || '나가기에 실패했습니다.';
      showToast(msg, { type: 'error' });
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='animate-pulse h-8 w-1/3 bg-gray-200 rounded' />
          <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='md:col-span-2 space-y-3'>
              <div className='h-5 w-1/2 bg-gray-200 rounded' />
              <div className='h-5 w-2/3 bg-gray-200 rounded' />
              <div className='h-5 w-1/3 bg-gray-200 rounded' />
            </div>
            <div className='space-y-3'>
              <div className='h-10 w-full bg-gray-200 rounded' />
              <div className='h-10 w-full bg-gray-200 rounded' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const isFull =
    (detail?.participantCount ?? 0) >= (detail?.maxParticipants ?? 4);

  return (
    <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <button
          type='button'
          className='text-sm text-gray-600 hover:text-gray-900'
          onClick={() => navigate('/app/rooms')}>
          ← 목록으로
        </button>
        <div className='mt-3 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
              {detail.title}
            </h1>
            <p className='mt-1 text-sm text-gray-600'>{detail.description}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium border ${
              isFull
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
            인원 {detail.participantCount ?? 0}/{detail.maxParticipants ?? 4}
          </span>
        </div>

        <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-2'>
            <h2 className='text-lg font-semibold text-gray-900'>참여자</h2>
            {cachedParticipants.length === 0 ? (
              <p className='mt-2 text-sm text-gray-600'>
                참여자가 아직 없어요.
              </p>
            ) : (
              <ul className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {cachedParticipants.map((p) => (
                  <li
                    key={p.id}
                    className='card w-full'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-gray-200' />
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {p.nickname || p.name || '사용자'}
                          </p>
                          {p.role && (
                            <p className='text-xs text-gray-500'>{p.role}</p>
                          )}
                        </div>
                      </div>
                      <span className='text-xs text-gray-500'>
                        {p.status || ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='space-y-3'>
            <button
              type='button'
              className='btn-primary w-full disabled:opacity-60'
              disabled={joining || isFull}
              onClick={handleJoin}>
              {joining
                ? '참여 중...'
                : isFull
                ? '정원이 가득찼어요'
                : '참여하기'}
            </button>
            <button
              type='button'
              className='btn-secondary w-full disabled:opacity-60'
              disabled={leaving}
              onClick={handleLeave}>
              {leaving ? '나가는 중...' : '나가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
