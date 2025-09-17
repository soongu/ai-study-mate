import React from 'react';

const ScoreBadge = ({ label, value }) => (
  <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-50'>
    <span className='w-2 h-2 rounded-full bg-indigo-500' />
    {label}: {value == null ? '-' : value}
  </span>
);

const List = ({ title, items }) => (
  <div>
    <p className='text-sm font-medium text-gray-900 mb-1'>{title}</p>
    {!items || items.length === 0 ? (
      <p className='text-sm text-gray-500'>없음</p>
    ) : (
      <ul className='list-disc pl-5 space-y-1 text-sm'>
        {items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
    )}
  </div>
);

const ReviewResult = ({ result, loading }) => {
  if (loading)
    return <div className='text-sm text-gray-600'>결과를 불러오는 중...</div>;
  if (!result)
    return <div className='text-sm text-gray-600'>아직 결과가 없습니다.</div>;

  const { summary, scores, issues, suggestions, quickWins, breakingChanges } =
    result;
  return (
    <div className='space-y-4'>
      <div className='p-3 border rounded bg-white'>
        <p className='text-sm text-gray-800 whitespace-pre-wrap'>
          {summary || '-'}
        </p>
      </div>
      <div className='flex items-center flex-wrap gap-2'>
        <ScoreBadge
          label='보안'
          value={scores?.security}
        />
        <ScoreBadge
          label='성능'
          value={scores?.performance}
        />
        <ScoreBadge
          label='가독성'
          value={scores?.readability}
        />
      </div>
      <List
        title='문제점'
        items={issues}
      />
      <List
        title='제안'
        items={suggestions}
      />
      <List
        title='Quick Wins'
        items={quickWins}
      />
      <List
        title='Breaking Changes'
        items={breakingChanges}
      />
    </div>
  );
};

export default ReviewResult;
