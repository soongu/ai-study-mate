import React from 'react';

// HistoryItem: 히스토리(스레드) 목록의 한 항목
// - type 배지 대신 스레드 개수 뱃지, 프롬프트 요약, 생성 시각
// - selected true면 배경 강조합니다.
const formatDateTime = (v) => {
  try {
    const d = typeof v === 'number' ? new Date(v) : new Date(v || Date.now());
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const HistoryItem = ({ item, selected, onClick }) => {
  const count = item?.count || (item?.children ? item.children.length : 1);
  const promptPreview = item?.prompt?.slice(0, 40) || '-';
  const createdAt = formatDateTime(item?.createdAt);

  return (
    <div
      className={'group relative rounded ' + (selected ? 'bg-gray-100' : '')}>
      <button
        type='button'
        className={
          'w-full text-left px-2 py-1 rounded hover:bg-gray-100 ' +
          (selected ? 'bg-gray-100' : '')
        }
        onClick={onClick}
        aria-label='기록 선택'>
        <div className='flex items-center gap-2'>
          <span
            className='text-[11px] px-1 rounded border bg-gray-50'
            title='스레드 내 메시지 수'>
            {count}
          </span>
          <span className='truncate text-sm'>{promptPreview}</span>
        </div>
        <div className='text-[10px] text-gray-500'>{createdAt}</div>
      </button>
    </div>
  );
};

export default HistoryItem;
