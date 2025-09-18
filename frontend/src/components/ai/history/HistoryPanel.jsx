import React, { useEffect, useRef, useState } from 'react';
import HistoryList from './HistoryList.jsx';
import HistoryDetail from './HistoryDetail.jsx';
import useHistoryStore from '../../../stores/historyStore.js';

// HistoryPanel: AI 대화 히스토리 패널(모달)
// - 접근성: role='dialog' aria-modal='true' aria-labelledby 로 제목을 연결
// - 레이아웃: 좌측 목록(고정폭), 우측 상세(가변) 2컬럼
// - 닫기 UX: 배경 클릭 또는 ESC 키로 닫기
const HistoryPanel = () => {
  const dialogRef = useRef(null);
  const {
    open,
    items,
    selected,
    closePanel,
    setSelected,
    query,
    typeFilter,
    setQuery,
    setTypeFilter,
    getFilteredItems,
    removeItemById,
    loading,
    error,
    loadRecent,
  } = useHistoryStore();

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // 패널이 열릴 때 최근 히스토리 로드
  useEffect(() => {
    if (open) {
      loadRecent(10);
    }
  }, [open, loadRecent]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closePanel]);

  if (!open) return null;

  const filtered = getFilteredItems();

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
  };
  const handleConfirm = () => {
    if (pendingDeleteId) removeItemById(pendingDeleteId);
    setPendingDeleteId(null);
  };
  const handleCancel = () => setPendingDeleteId(null);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby='history-title'
      onMouseDown={(e) => {
        // 바깥(오버레이) 클릭 시 닫기
        if (e.target === e.currentTarget) closePanel();
      }}>
      {/* 오버레이 */}
      <div className='absolute inset-0 bg-black/40' />

      {/* 컨테이너 */}
      <div
        ref={dialogRef}
        className='relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-lg border flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between px-4 py-2 border-b gap-3'>
          <div className='flex items-center gap-3 flex-1'>
            <h2
              id='history-title'
              className='text-sm font-semibold'>
              최근 대화 기록
            </h2>
            {/* 검색창 */}
            <label
              className='sr-only'
              htmlFor='history-search'>
              히스토리 검색
            </label>
            <input
              id='history-search'
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='프롬프트/응답 검색'
              className='flex-1 min-w-0 text-sm px-2 py-1 border rounded'
              aria-label='프롬프트 또는 응답 검색'
            />
            {/* 타입 필터 */}
            <label
              className='sr-only'
              htmlFor='history-type'>
              타입 필터
            </label>
            <select
              id='history-type'
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className='text-sm px-2 py-1 border rounded'
              aria-label='대화 타입 필터'>
              <option value='ALL'>전체</option>
              <option value='QA'>질문답변</option>
              <option value='REVIEW'>코드리뷰</option>
              <option value='CONCEPT'>개념설명</option>
            </select>
            <span
              className='text-xs text-gray-500 whitespace-nowrap'
              aria-live='polite'>
              {filtered.length}/{items.length}
            </span>
          </div>
          <button
            type='button'
            className='p-1 rounded hover:bg-gray-100'
            aria-label='닫기'
            onClick={closePanel}
            autoFocus>
            ✕
          </button>
        </div>

        {/* 본문: 2컬럼 레이아웃 */}
        <div className='flex min-h-[60vh] max-h-[75vh]'>
          {/* 좌측 목록 */}
          <aside className='w-[280px] border-r overflow-auto p-2'>
            {loading ? (
              <div className='text-xs text-gray-500 p-2'>불러오는 중...</div>
            ) : error ? (
              <div className='text-xs text-red-600 p-2'>{error}</div>
            ) : (
              <HistoryList
                items={filtered}
                selectedId={selected?.id}
                onSelect={(it) => setSelected(it)}
              />
            )}
          </aside>
          {/* 우측 상세 */}
          <section className='flex-1 overflow-auto p-3'>
            <HistoryDetail item={selected} />
          </section>
        </div>

        {/* 삭제 확인 모달(간단 스텁) */}
        {pendingDeleteId && (
          <div className='absolute inset-0 z-20 flex items-center justify-center'>
            <div
              className='absolute inset-0 bg-black/30'
              onClick={handleCancel}
            />
            <div className='relative z-30 bg-white border rounded shadow p-4 w-72'>
              <p className='text-sm mb-3'>
                이 기록을 삭제할까요? (후속 API 연동 예정)
              </p>
              <div className='flex justify-end gap-2'>
                <button
                  className='px-3 py-1 text-sm rounded border'
                  onClick={handleCancel}>
                  취소
                </button>
                <button
                  className='px-3 py-1 text-sm rounded bg-red-600 text-white'
                  onClick={handleConfirm}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
