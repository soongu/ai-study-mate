import React from 'react';
import HistoryItem from './HistoryItem.jsx';

// HistoryList: 좌측 목록 영역(스켈레톤)
const HistoryList = ({ items, onSelect, selectedId }) => {
  if (!items || items.length === 0) {
    return <div className='text-xs text-gray-500 p-2'>기록이 없습니다.</div>;
  }
  return (
    <ul className='space-y-1'>
      {items.map((it) => (
        <li key={it.id}>
          <HistoryItem
            item={it}
            selected={selectedId === it.id}
            onClick={() => onSelect?.(it)}
          />
        </li>
      ))}
    </ul>
  );
};

export default HistoryList;
