import React, { useEffect, useRef, useState } from 'react';
import HistoryList from './HistoryList.jsx';
import HistoryDetail from './HistoryDetail.jsx';

// HistoryPanel: AI 대화 히스토리 패널(모달)
// - 접근성: role="dialog" aria-modal="true" aria-labelledby 로 제목을 연결
// - 레이아웃: 좌측 목록(고정폭), 우측 상세(가변) 2컬럼
// - 닫기 UX: 배경 클릭 또는 ESC 키로 닫기
const HistoryPanel = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const [selected, setSelected] = useState(null);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby='history-title'
      onMouseDown={(e) => {
        // 바깥(오버레이) 클릭 시 닫기
        if (e.target === e.currentTarget) onClose?.();
      }}>
      {/* 오버레이 */}
      <div className='absolute inset-0 bg-black/40' />

      {/* 컨테이너 */}
      <div
        ref={dialogRef}
        className='relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-lg border flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between px-4 py-2 border-b'>
          <h2
            id='history-title'
            className='text-sm font-semibold'>
            최근 대화 기록
          </h2>
          <button
            type='button'
            className='p-1 rounded hover:bg-gray-100'
            aria-label='닫기'
            onClick={onClose}
            autoFocus>
            ✕
          </button>
        </div>

        {/* 본문: 2컬럼 레이아웃 */}
        <div className='flex min-h-[60vh] max-h-[75vh]'>
          {/* 좌측 목록 */}
          <aside className='w-[280px] border-r overflow-auto p-2'>
            <HistoryList
              items={[]}
              selectedId={selected?.id}
              onSelect={(it) => setSelected(it)}
            />
          </aside>
          {/* 우측 상세 */}
          <section className='flex-1 overflow-auto p-3'>
            <HistoryDetail item={selected} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
