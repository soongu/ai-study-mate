import React from 'react';

// HistoryItem: 히스토리 목록의 한 항목
// - type 배지(QA/REVIEW), 프롬프트 요약, 생성 시각을 간단히 표시합니다.
// - selected true면 배경 강조합니다.
const HistoryItem = ({ item, selected, onClick }) => {
  const type = item?.type || 'QA';
  const promptPreview = item?.prompt?.slice(0, 40) || '-';
  const createdAt = item?.createdAt || '';

  return (
    <button
      type='button'
      className={
        'w-full text-left px-2 py-1 rounded hover:bg-gray-100 ' +
        (selected ? 'bg-gray-100' : '')
      }
      onClick={onClick}
      aria-label='기록 선택'>
      <div className='flex items-center gap-2'>
        <span className='text-[11px] px-1 rounded border bg-gray-50'>
          {type}
        </span>
        <span className='truncate text-sm'>{promptPreview}</span>
      </div>
      <div className='text-[10px] text-gray-500'>{createdAt}</div>
    </button>
  );
};

export default HistoryItem;
