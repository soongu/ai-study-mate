// 스터디룸 생성 모달 컴포넌트
// - 제목/설명 입력을 받아 방 생성 요청 전까지의 UX를 담당합니다.
// - 입력 유효성 검사, 실시간 피드백, 제출/로딩/에러 표시 포함
import React, { useEffect, useMemo, useState } from 'react';

// 입력값 검증 기준
const TITLE_MIN = 2;
const TITLE_MAX = 50;
const DESC_MAX = 200;

// Props
// - open: 모달 열림/닫힘
// - onClose: 닫기 콜백(오버레이/ESC/닫기 버튼)
// - onSubmit: 유효성 통과 시 부모로 제목/설명 전달
// - submitting: 제출 중 로딩 상태(버튼 비활성화/텍스트 변경)
// - errorMessage: 서버 측 에러 메시지 표시
const CreateRoomModal = ({
  open,
  onClose,
  onSubmit,
  submitting = false,
  errorMessage = '',
}) => {
  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // touched 상태변수는 각 입력 필드(title, description)가 사용자의 포커스(입력) 이후에 blur(포커스 아웃) 되었는지 여부를 추적합니다.
  // 이를 통해 사용자가 입력을 시작하기 전에는 에러 메시지를 표시하지 않고, 입력 후에만 유효성 에러 메시지를 보여줄 수 있습니다.
  const [touched, setTouched] = useState({ title: false, description: false });

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setTouched({ title: false, description: false });
    }
  }, [open]);

  // ESC 키로 닫기 (제출 중에는 닫기 방지)
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape' && open && !submitting) onClose?.();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, submitting, onClose]);

  // 제목 유효성 검사 메시지
  const titleError = useMemo(() => {
    if (!touched.title) return '';
    if (!title.trim()) return '방 제목을 입력해주세요.';
    if (title.trim().length < TITLE_MIN)
      return `최소 ${TITLE_MIN}자 이상 입력해주세요.`;
    if (title.trim().length > TITLE_MAX)
      return `최대 ${TITLE_MAX}자까지 가능합니다.`;
    return '';
  }, [title, touched.title]);

  // 설명 유효성 검사 메시지
  const descError = useMemo(() => {
    if (!touched.description) return '';
    if (description.length > DESC_MAX)
      return `설명은 최대 ${DESC_MAX}자까지 가능합니다.`;
    return '';
  }, [description, touched.description]);

  // 폼 전체 유효성 여부
  const isValid = useMemo(() => {
    const t = title.trim();
    return (
      t.length >= TITLE_MIN &&
      t.length <= TITLE_MAX &&
      description.length <= DESC_MAX
    );
  }, [title, description]);

  // 제출 처리
  // - 기본 제출 이벤트 막기
  // - 터치 플래그로 즉시 에러 메시지 노출 가능
  // - 유효하고 미제출 상태일 때만 부모 onSubmit 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true });
    if (!isValid || submitting) return;
    await onSubmit?.({ title: title.trim(), description: description.trim() });
  };

  // 모달이 닫혀있으면 렌더링하지 않음(포털/성능 최적화)
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* 배경 오버레이: 클릭 시 닫기 (제출 중 제외) */}
      <div
        className='absolute inset-0 bg-black/40'
        onClick={() => (!submitting ? onClose?.() : undefined)}
      />
      {/* 컨텐츠 래퍼: 살짝 위로 올라오는 애니메이션 */}
      <div className='relative z-10 w-full max-w-lg mx-4 animate-slide-up'>
        <div className='bg-white rounded-2xl shadow-xl border p-6'>
          <div className='flex items-start justify-between'>
            <div>
              {/* 모달 타이틀/설명 */}
              <h2 className='text-xl font-bold text-gray-900'>스터디룸 생성</h2>
              <p className='mt-1 text-sm text-gray-600'>
                최대 4명까지 참여 가능한 방을 만들어요.
              </p>
            </div>
            {/* 우상단 닫기 버튼 */}
            <button
              type='button'
              className='rounded-lg p-2 hover:bg-gray-100 text-gray-500'
              onClick={() => (!submitting ? onClose?.() : undefined)}
              aria-label='닫기'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
                fill='currentColor'
                className='w-5 h-5'>
                <path
                  fillRule='evenodd'
                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>

          {/* 폼 시작 */}
          <form
            onSubmit={handleSubmit}
            className='mt-6'>
            <div className='space-y-5'>
              <div>
                {/* 제목 입력 */}
                <label className='block text-sm font-medium text-gray-700'>
                  방 제목
                </label>
                <input
                  type='text'
                  className={`input-field mt-1 ${
                    titleError ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                  placeholder='예) 알고리즘 아침 스터디'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  // maxLength={TITLE_MAX + 5}로 설정한 이유:
                  // 사용자가 붙여넣기 등으로 TITLE_MAX(50자)를 초과하는 입력을 시도할 때,
                  // 실시간으로 에러 메시지와 글자 수 카운터를 보여주기 위함입니다.
                  // 만약 maxLength를 TITLE_MAX로 제한하면 초과 입력 자체가 불가능해져
                  // "최대 50자까지 가능합니다"와 같은 피드백을 줄 수 없습니다.
                  // 그래서 약간 여유(5자)를 두어 초과 입력도 받고, UI에서 경고를 노출합니다.
                  maxLength={TITLE_MAX + 5}
                />
                <div className='mt-1 flex items-center justify-between'>
                  {/* 유효성 메시지 또는 가이드 텍스트 */}
                  {titleError ? (
                    <p className='text-xs text-red-600'>{titleError}</p>
                  ) : (
                    <span className='text-xs text-gray-500'>
                      최소 {TITLE_MIN}자, 최대 {TITLE_MAX}자
                    </span>
                  )}
                  {/* 현재 글자수 카운터 */}
                  <span
                    className={`text-xs ${
                      title.length > TITLE_MAX
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                    {title.trim().length}/{TITLE_MAX}
                  </span>
                </div>
              </div>

              <div>
                {/* 설명 입력 (선택) */}
                <label className='block text-sm font-medium text-gray-700'>
                  설명 (선택)
                </label>
                <textarea
                  className={`input-field mt-1 h-28 resize-none ${
                    descError ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                  placeholder='방 소개를 간단히 적어주세요.'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, description: true }))
                  }
                  maxLength={DESC_MAX + 20}
                />
                <div className='mt-1 flex items-center justify-between'>
                  {/* 유효성 메시지 또는 가이드 텍스트 */}
                  {descError ? (
                    <p className='text-xs text-red-600'>{descError}</p>
                  ) : (
                    <span className='text-xs text-gray-500'>
                      최대 {DESC_MAX}자
                    </span>
                  )}
                  {/* 현재 글자수 카운터 */}
                  <span
                    className={`text-xs ${
                      description.length > DESC_MAX
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}>
                    {description.length}/{DESC_MAX}
                  </span>
                </div>
              </div>
            </div>

            {/* 서버 에러 메시지 영역 */}
            {errorMessage && (
              <div className='mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700'>
                {errorMessage}
              </div>
            )}

            {/* 하단 액션 버튼: 취소/생성 */}
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                type='button'
                className='btn-secondary'
                onClick={() => (!submitting ? onClose?.() : undefined)}>
                취소
              </button>
              <button
                type='submit'
                className='btn-primary disabled:opacity-60'
                disabled={!isValid || submitting}>
                {submitting ? '생성 중...' : '방 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
