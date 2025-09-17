import React, { useEffect, useRef, useState } from 'react';
import ReviewRequestForm from './ReviewRequestForm.jsx';
import ReviewResult from './ReviewResult.jsx';
import { AIService } from '../../../services/aiService.js';
import { useToast } from '../../toast/toastContext.js';
import { estimateTokens } from '../../../utils/tokenEstimate.js';

const TABS = { REQUEST: 'REQUEST', RESULT: 'RESULT' };
const LOADING_MESSAGES = [
  '코드를 이해하는 중...',
  '보안 이슈를 스캔하는 중...',
  '성능 병목을 점검하는 중...',
  '가독성과 구조를 검토하는 중...',
  '개선 제안을 정리하는 중...',
];

const CodeReviewModal = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const [tab, setTab] = useState(TABS.REQUEST);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { show: showToast } = useToast();
  const [loadingStep, setLoadingStep] = useState(0);
  const [estTokens, setEstTokens] = useState(null);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const id = setInterval(() => setLoadingStep((s) => s + 1), 900);
    return () => clearInterval(id);
  }, [loading]);

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
        <div className='relative p-4 h-[60vh] overflow-auto'>
          {loading && (
            <div className='absolute inset-0 z-10 bg-white/70 flex flex-col items-center justify-center gap-3'>
              <div className='flex items-center gap-2'>
                <div className='w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin' />
                <span className='text-sm text-gray-800'>
                  AI가 분석하고 있어요
                </span>
              </div>
              <div className='text-xs text-gray-600'>
                {LOADING_MESSAGES[loadingStep % LOADING_MESSAGES.length]}
              </div>
              <div className='w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-indigo-600 transition-all duration-700'
                  style={{ width: `${((loadingStep % 6) + 1) * (100 / 6)}%` }}
                />
              </div>
            </div>
          )}
          {tab === TABS.REQUEST ? (
            <ReviewRequestForm
              loading={loading}
              onSubmit={async ({ language, code, context }) => {
                setLoading(true);
                setResult(null);
                // 대략적인 토큰 추정(코드+컨텍스트 합)
                setEstTokens(
                  estimateTokens(
                    (context || '') + '\n' + (code || ''),
                    language
                  )
                );
                try {
                  const res = await AIService.reviewCode({
                    language,
                    code,
                    context,
                  });
                  // ApiResponse { status, message, data } 언랩
                  const data = res?.data?.data ?? res?.data ?? res;
                  if (!data || typeof data !== 'object') {
                    throw new Error('서버 응답 형식이 올바르지 않습니다.');
                  }
                  setResult(data);
                  setTab(TABS.RESULT);
                } catch (e) {
                  const errMsg = e?.message || '요청에 실패했습니다.';
                  showToast(errMsg, { type: 'error' });
                  setResult({
                    summary: errMsg,
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
          {loading && (
            <div className='mt-2 text-[11px] text-gray-600'>
              예상 토큰 사용량: {estTokens ?? '-'} tokens (대략치)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeReviewModal;
