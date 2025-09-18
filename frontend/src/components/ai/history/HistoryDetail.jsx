import React from 'react';

// HistoryDetail: 우측 상세 영역(스켈레톤)
const HistoryDetail = ({ item }) => {
  if (!item) {
    return (
      <div className='text-xs text-gray-500'>좌측에서 항목을 선택하세요.</div>
    );
  }
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='text-[11px] px-1 rounded border bg-gray-50'>
          {item.type || 'QA'}
        </span>
        <span className='text-[11px] text-gray-500'>
          {item.createdAt || ''}
        </span>
      </div>
      <div>
        <p className='text-xs text-gray-600 mb-1'>프롬프트</p>
        <pre className='whitespace-pre-wrap text-sm border rounded p-2 bg-gray-50'>
          {item.prompt || ''}
        </pre>
      </div>
      <div>
        <p className='text-xs text-gray-600 mb-1'>응답</p>
        <pre className='whitespace-pre-wrap text-sm border rounded p-2'>
          {item.response || ''}
        </pre>
      </div>
    </div>
  );
};

export default HistoryDetail;
