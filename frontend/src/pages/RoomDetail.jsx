/**
 * 방 상세 페이지
 *
 * 목적
 * - 특정 스터디룸의 상세 정보(제목/설명/현재 인원)를 보여줍니다.
 * - 참여자 목록(역할/상태/프로필)을 렌더링합니다.
 * - 사용자의 상태(호스트/참여자/미참여)에 따라 버튼 노출/비활성화가 달라집니다.
 * - 참여/나가기 후 인원 수와 참여자 목록을 즉시 동기화합니다.
 *
 * 설계 포인트
 * - 참여자 목록은 전역 store에 roomId별로 캐시하여 재방문 시 재요청을 줄입니다.
 * - 상세 정보는 항상 최신값을 받기 위해 매 진입 시 조회합니다.
 * - 백엔드 미구현/에러 시 참여자 목록은 안전하게 빈 배열([])로 폴백합니다.
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import MessageList from '../components/room/MessageList.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomService } from '../services/roomService.js';
import { useRoomStore } from '../stores/roomStore.js';
import { useToast } from '../components/toast/toastContext.js';
import { useAuthStore } from '../stores/authStore.js';
// presence 구독 추가
import {
  connect as wsConnect,
  subscribe as wsSubscribe,
  send as wsSend,
} from '../services/websocketService.js';
// SSE 알림 리스너 추가
import {
  addSSEListener,
  removeSSEListener,
} from '../services/notificationService.js';

const RoomDetail = () => {
  // 경로 파라미터(:id)를 숫자로 변환 (NaN 방지)
  const { id } = useParams();
  const roomId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const { show: showToast } = useToast();

  // 전역 Store 액션/상태 (shallow로 안정화)
  const updateRoomParticipantsCount = useRoomStore(
    (s) => s.updateRoomParticipantsCount
  );
  const participantsCache = useRoomStore((s) => s.participantsByRoomId);
  const setParticipants = useRoomStore((s) => s.setParticipants);
  const updateParticipantStatus = useRoomStore(
    (s) => s.updateParticipantStatus
  );
  // 현재 로그인 사용자(내 역할/버튼 조건 판별에 사용)
  const me = useAuthStore((s) => s.user);
  const refreshMeSilent = useAuthStore((s) => s.refreshMeSilent);

  // 화면 상태
  // - loading: 초기 로딩/재조회 중 여부
  // - detail: 방 상세 데이터(제목/설명/현재 인원 등)
  // - joining/leaving: 액션 진행 중(중복 클릭 방지)
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [updatingPresence, setUpdatingPresence] = useState(false);

  // 참여자 목록: 전역 캐시에서 현재 roomId에 해당하는 리스트를 가져옵니다.
  const cachedParticipants = useMemo(
    () => participantsCache[roomId] || [],
    [participantsCache[roomId]]
  );
  // 내 참여 정보: userId로 캐시 목록에서 내 항목을 찾습니다.
  const myParticipant = useMemo(
    () =>
      me ? cachedParticipants.find((p) => p.userId === me.id) || null : null,
    [me, cachedParticipants]
  );
  // 버튼/노출 조건: 호스트인지, 호스트가 아닌 참여자인지
  const isHost = myParticipant?.role === 'HOST';
  const isMemberNonHost = !!myParticipant && !isHost;
  const isParticipant = isHost || isMemberNonHost;

  // 채팅 탭 열림 여부
  const [chatOpen, setChatOpen] = useState(false);

  // 초기 로딩 및 roomId 변경 시 데이터 로드 (의존성 안정화)
  useEffect(() => {
    let ignore = false;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const d = await RoomService.getRoomDetail(roomId);
        if (!ignore) {
          setDetail(d);
        }
        // 참여자 캐시가 없으면 로드 시도
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
  }, [roomId]); // 의존성을 roomId만으로 제한

  // presence 구독: 방 상세 뷰가 열려있는 동안 상태 변경을 실시간 반영
  const updateParticipantStatusRef = useRef(updateParticipantStatus);
  useEffect(() => {
    updateParticipantStatusRef.current = updateParticipantStatus;
  }, [updateParticipantStatus]);

  useEffect(() => {
    if (!roomId) return;
    wsConnect();
    const unsubscribe = wsSubscribe(
      `/topic/rooms/${roomId}/presence`,
      (msg) => {
        try {
          const data = JSON.parse(msg.body);
          if (data?.type === 'PRESENCE') {
            updateParticipantStatusRef.current(roomId, data);
          }
        } catch (e) {
          if (import.meta.env?.DEV) console.warn('presence parse error', e);
        }
      }
    );
    return () => unsubscribe?.();
  }, [roomId]);

  // 🔔 SSE 알림 리스너: 현재 방과 관련된 알림을 받아서 토스트로 표시
  useEffect(() => {
    if (!roomId) return;

    const handleNotification = (notification) => {
      // 현재 방과 관련된 알림만 처리
      if (notification.roomId !== roomId) return;

      // 알림 타입별로 토스트 메시지 표시
      switch (notification.type) {
        case 'CHAT_MESSAGE':
          // 채팅 메시지는 이미 WebSocket으로 실시간 표시되므로 토스트는 생략
          // (탭이 백그라운드일 때만 브라우저 알림으로 표시됨)
          break;

        case 'USER_JOIN':
          if (notification.providerId !== me?.providerId) {
            showToast(
              `👋 ${notification.nickname}님이 입장했습니다`,
              'success'
            );
          }
          break;

        case 'USER_LEAVE':
          if (notification.providerId !== me?.providerId) {
            showToast(`👋 ${notification.nickname}님이 퇴장했습니다`, 'info');
          }
          break;

        case 'PRESENCE_UPDATE':
          if (notification.providerId !== me?.providerId) {
            const statusText =
              notification.data?.status === 'STUDYING'
                ? '학습 중'
                : notification.data?.status === 'BREAK'
                ? '휴식 중'
                : notification.data?.status === 'ONLINE'
                ? '온라인'
                : '상태 변경';
            showToast(
              `📊 ${notification.nickname}님이 ${statusText}로 변경했습니다`,
              'info'
            );
          }
          break;

        default:
          // 기타 알림은 메시지 그대로 표시
          showToast(notification.message, 'info');
      }
    };

    // SSE 알림 리스너 등록
    const listenerId = addSSEListener('notification', handleNotification);

    return () => {
      // 컴포넌트 언마운트 시 리스너 제거
      removeSSEListener('notification', listenerId);
    };
  }, [roomId, me?.providerId, showToast]);

  // 하트비트: 방 상세 페이지가 열려 있고 참여자인 동안만 주기 전송
  useEffect(() => {
    if (!roomId || !isParticipant) return;
    let intervalId = null;
    const start = () => {
      if (document.visibilityState !== 'visible') return;
      if (intervalId) return;
      intervalId = setInterval(() => {
        wsSend(`/app/rooms/${roomId}/presence/heartbeat`, {});
      }, 15000);
    };
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    start();
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', start);
    window.addEventListener('blur', stop);
    return () => {
      stop();
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', start);
      window.removeEventListener('blur', stop);
    };
  }, [roomId, isParticipant]);

  // 내 상태(ONLINE/STUDYING/BREAK) 변경 전송
  const handleChangeMyStatus = async (next) => {
    if (!roomId || !isParticipant || updatingPresence) return;
    try {
      setUpdatingPresence(true);
      const ok = wsSend(`/app/rooms/${roomId}/presence/update`, {
        status: next,
      });
      if (!ok) {
        showToast('연결 상태를 확인해주세요.', { type: 'error' });
      }
    } finally {
      setUpdatingPresence(false);
    }
  };

  // 참여하기
  // - 성공: 상세/목록 인원 수 동기화 → 참여자 재조회 → 성공 토스트
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
      // 내 참여방 수 최신화(백그라운드)
      refreshMeSilent();
    } catch (e) {
      const msg = e?.response?.data?.message || '참여에 실패했습니다.';
      showToast(msg, { type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  // 나가기
  // - 성공: 상세/목록 인원 수 동기화 → 참여자 재조회 → 성공 토스트
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
      // 방 나가기 시 채팅 패널도 닫아 재구독으로 인한 JOIN/LEAVE 소음을 줄입니다.
      setChatOpen(false);
      // 내 참여방 수 최신화(백그라운드)
      refreshMeSilent();
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
          {/* 상세 영역 스켈레톤 */}
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

  // 정원 가득 찼는지 여부(MVP에서 최대 4명)
  const isFull =
    (detail?.participantCount ?? 0) >= (detail?.maxParticipants ?? 4);

  return (
    <div className='min-h-[calc(100vh-10rem)] bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* 뒤로가기(목록으로) */}
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
          {/* 현재 인원/정원 배지 */}
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
                        {/* 프로필 이미지(없으면 회색 플레이스홀더) */}
                        {p.profileImageUrl ? (
                          <img
                            src={p.profileImageUrl}
                            alt={p.nickname || '사용자'}
                            className='w-9 h-9 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-9 h-9 rounded-full bg-gray-200' />
                        )}
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {p.nickname || p.name || '사용자'}
                          </p>
                          {/* 역할(HOST/PARTICIPANT) 표시 */}
                          {p.role && (
                            <p className='text-xs text-gray-500'>{p.role}</p>
                          )}
                        </div>
                      </div>
                      {/* 상태(ONLINE/STUDYING/BREAK/OFFLINE) 표시 (색상 배지) */}
                      {(() => {
                        const status = p.status || 'OFFLINE';
                        const badge = {
                          ONLINE: 'bg-green-50 text-green-700 border-green-200',
                          STUDYING: 'bg-blue-50 text-blue-700 border-blue-200',
                          BREAK:
                            'bg-yellow-50 text-yellow-700 border-yellow-200',
                          OFFLINE: 'bg-gray-200 text-gray-600 border-gray-300',
                        };
                        const dot = {
                          ONLINE: 'bg-green-500',
                          STUDYING: 'bg-blue-500',
                          BREAK: 'bg-yellow-500',
                          OFFLINE: 'bg-gray-400',
                        };
                        const badgeCls = `inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
                          badge[status] || badge.OFFLINE
                        }`;
                        const dotCls = `w-2 h-2 rounded-full mr-1 ${
                          dot[status] || dot.OFFLINE
                        }`;
                        return (
                          <span className={badgeCls}>
                            <span className={dotCls} />
                            {status}
                          </span>
                        );
                      })()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 버튼 영역: 호스트는 버튼 숨김, 참여자는 "참여하기" 비활성화 */}
          {!isHost && (
            <div className='space-y-3'>
              <button
                type='button'
                className='btn-primary w-full disabled:opacity-60'
                disabled={joining || isFull || isMemberNonHost}
                onClick={handleJoin}>
                {joining
                  ? '참여 중...'
                  : isFull
                  ? '정원이 가득찼어요'
                  : isMemberNonHost
                  ? '이미 참여 중'
                  : '참여하기'}
              </button>
              <button
                type='button'
                className='btn-secondary w-full disabled:opacity-60'
                disabled={leaving || !isMemberNonHost}
                onClick={handleLeave}>
                {leaving ? '나가는 중...' : '나가기'}
              </button>
            </div>
          )}
          {/* 채팅 패널: 항상 참여자 목록 하단에 위치 (비참여자는 차단) */}
          <div className='mt-6 md:col-span-2'>
            {isParticipant ? (
              <>
                <button
                  type='button'
                  className='btn-secondary'
                  onClick={() => setChatOpen((v) => !v)}>
                  {chatOpen ? '채팅 닫기' : '채팅 열기'}
                </button>
                {chatOpen && (
                  <div className='h-[420px] mt-3'>
                    <MessageList
                      roomId={roomId}
                      open={chatOpen}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className='p-4 border rounded bg-gray-50 text-sm text-gray-600'>
                채팅은 방에 참여한 사용자만 이용할 수 있어요. 먼저 참여하기를
                눌러주세요.
              </div>
            )}
          </div>
          <div className='md:col-span-1 space-y-3'>
            {/* 나의 상태 토글: 참여자만 노출 */}
            {isParticipant && (
              <div className='card p-3'>
                <p className='text-sm font-medium text-gray-900'>나의 상태</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {['ONLINE', 'STUDYING', 'BREAK'].map((s) => (
                    <button
                      key={s}
                      type='button'
                      className={`px-3 py-1 rounded-full border text-xs ${
                        myParticipant?.status === s
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-60`}
                      disabled={updatingPresence}
                      onClick={() => handleChangeMyStatus(s)}>
                      {s}
                    </button>
                  ))}
                </div>
                <p className='mt-2 text-[11px] text-gray-500'>
                  탭이 활성화된 동안 15초 간격으로 하트비트를 전송합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
