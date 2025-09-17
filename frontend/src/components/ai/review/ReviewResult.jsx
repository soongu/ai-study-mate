import React from 'react';

const ScoreBadge = ({ label, value }) => (
  <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-50'>
    <span className='w-2 h-2 rounded-full bg-indigo-500' />
    {label}: {value == null ? '-' : value}
  </span>
);

const List = ({ title, items, onItemClick }) => (
  <div>
    <p className='text-sm font-medium text-gray-900 mb-1'>{title}</p>
    {!items || items.length === 0 ? (
      <p className='text-sm text-gray-500'>없음</p>
    ) : (
      <ul className='list-disc pl-5 space-y-1 text-sm'>
        {items.map((it, idx) => (
          <li
            key={idx}
            className={onItemClick ? 'cursor-pointer hover:underline' : ''}
            onClick={() => {
              if (!onItemClick) return;
              const m = String(it).match(/(\d{1,5})/);
              const line = m ? parseInt(m[1], 10) : null;
              if (line) onItemClick(line);
            }}>
            {it}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SeverityDot = ({ level }) => {
  const map = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-gray-400',
  };
  const color = map[(level || '').toLowerCase()] || 'bg-gray-300';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title='심각도: critical > high > medium > low'
    />
  );
};

const IssueList = ({ title, issues, onItemClick }) => (
  <div>
    <p className='text-sm font-medium text-gray-900 mb-1'>{title}</p>
    {!issues || issues.length === 0 ? (
      <p className='text-sm text-gray-500'>없음</p>
    ) : (
      <ul className='space-y-2'>
        {issues.map((it, idx) => (
          <li
            key={idx}
            className='p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer'
            onClick={() => {
              if (!onItemClick) return;
              const firstHint =
                Array.isArray(it.lineHints) && it.lineHints.length > 0
                  ? String(it.lineHints[0])
                  : '';
              const m = firstHint.match(/(\d{1,5})/);
              const line = m ? parseInt(m[1], 10) : null;
              if (line) onItemClick(line);
            }}>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-900'>
              <SeverityDot level={it.severity} />
              <span>{it.title || '-'}</span>
              {it.severity && (
                <span
                  className='ml-auto text-[11px] px-1.5 py-0.5 rounded-full border bg-gray-50'
                  title='심각도가 높을수록 우선적으로 수정하세요.'>
                  {String(it.severity).toUpperCase()}
                </span>
              )}
            </div>
            {it.description && (
              <p className='mt-1 text-sm text-gray-700 whitespace-pre-wrap'>
                {it.description}
              </p>
            )}
            {Array.isArray(it.lineHints) && it.lineHints.length > 0 && (
              <p className='mt-1 text-xs text-gray-500'>
                힌트: {it.lineHints.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
    <p className='mt-1 text-[11px] text-gray-500'>
      항목을 클릭하면 해당 라인으로 이동해요. 설명을 먼저 읽고 수정 방향을
      잡아보세요.
    </p>
  </div>
);

const ReviewResult = ({ result, loading }) => {
  if (loading)
    return <div className='text-sm text-gray-600'>결과를 불러오는 중...</div>;
  if (!result)
    return <div className='text-sm text-gray-600'>아직 결과가 없습니다.</div>;

  console.log('result: ', result);

  const {
    summary,
    scores,
    issues,
    suggestions,
    quickWins,
    breakingChanges,
    issueDetails,
  } = result;
  return (
    <div className='space-y-4'>
      <div className='p-3 border rounded bg-white'>
        <p className='text-sm text-gray-800 whitespace-pre-wrap'>
          {summary || '-'}
        </p>
        <p className='mt-1 text-[11px] text-gray-500'>
          요약은 핵심만 담겨 있어요. 상세한 근거는 아래 문제점의 설명을
          확인하세요.
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
      {Array.isArray(issueDetails) && issueDetails.length > 0 ? (
        <IssueList
          title='문제점'
          issues={issueDetails}
          onItemClick={result?.onFocusLine}
        />
      ) : (
        <List
          title='문제점'
          items={issues}
          onItemClick={result?.onFocusLine}
        />
      )}
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
