import React, { useEffect, useRef, useState } from 'react';
import ReviewRequestForm from './ReviewRequestForm.jsx';
import ReviewResult from './ReviewResult.jsx';
import { AIService } from '../../../services/aiService.js';

const TABS = { REQUEST: 'REQUEST', RESULT: 'RESULT' };

const CodeReviewModal = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const [tab, setTab] = useState(TABS.REQUEST);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}>
      <div className='absolute inset-0 bg-black/40' />
      <div
        ref={dialogRef}
        className='relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-lg border'>
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <h3 className='text-base font-semibold'>코드 리뷰</h3>
          <button
            className='text-sm text-gray-500 hover:text-gray-800'
            onClick={onClose}
            aria-label='닫기'>
            ✕
          </button>
        </div>
        <div className='px-4 pt-3'>
          <div className='flex items-center gap-2 text-sm'>
            <button
              className={`px-3 py-1.5 rounded ${
                tab === TABS.REQUEST
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setTab(TABS.REQUEST)}>
              요청
            </button>
            <button
              className={`px-3 py-1.5 rounded ${
                tab === TABS.RESULT
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setTab(TABS.RESULT)}>
              결과
            </button>
          </div>
        </div>
        <div className='p-4 h-[60vh] overflow-auto'>
          {tab === TABS.REQUEST ? (
            <ReviewRequestForm
              loading={loading}
              onSubmit={async ({ language, code, context }) => {
                setLoading(true);
                setResult(null);
                try {
                  const res = await AIService.reviewCode({
                    language,
                    code,
                    context,
                  });
                  // ApiResponse 래핑을 고려
                  const data = res?.data || res;
                  setResult(data);
                  setTab(TABS.RESULT);
                } catch (e) {
                  setResult({
                    summary: e?.message || '요청에 실패했습니다.',
                    scores: {},
                    issues: [],
                    suggestions: [],
                    quickWins: [],
                    breakingChanges: [],
                  });
                  setTab(TABS.RESULT);
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : (
            <ReviewResult
              result={result}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeReviewModal;
