import React, { useState } from 'react';
import { detectCodeLanguage } from '../../../utils/codeLanguage.js';

const LANGS = ['auto', 'java', 'javascript', 'typescript', 'python', 'sql'];

const ReviewRequestForm = ({
  onSubmit,
  loading,
  focusLine,
  value,
  onChange,
}) => {
  const [language, setLanguage] = useState(value?.language ?? 'auto');
  const [code, setCode] = useState(value?.code ?? '');
  const [context, setContext] = useState(value?.context ?? '');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('코드는 필수입니다.');
      return;
    }
    setError(null);
    onSubmit?.({ language, code, context });
  };

  // 특정 라인으로 포커스/선택 이동 (1-based)
  React.useEffect(() => {
    if (!focusLine || !code) return;
    const lines = code.split('\n');
    const target = Math.max(1, Math.min(focusLine, lines.length));
    // 시작/끝 오프셋 계산
    let start = 0;
    for (let i = 0; i < target - 1; i++) start += lines[i].length + 1; // +1 for \n
    const end = start + (lines[target - 1]?.length ?? 0);
    const ta = document.getElementById('review-code-textarea');
    if (ta) {
      ta.focus();
      try {
        ta.setSelectionRange(start, end);
      } catch {}
      // 스크롤 보이도록
      const before = code.substring(0, start);
      const approxLines = before.split('\n').length;
      ta.scrollTop = Math.max(0, (approxLines - 3) * 18);
    }
  }, [focusLine, code]);

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-3'>
      <div className='flex items-center gap-2'>
        <label className='text-sm text-gray-700'>언어</label>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            onChange?.({ language: e.target.value, code, context });
          }}
          className='border rounded px-2 py-1 text-sm'>
          {LANGS.map((l) => (
            <option
              key={l}
              value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type='button'
          className='text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50'
          onClick={() => {
            const guessed = detectCodeLanguage(code);
            setLanguage(guessed);
            onChange?.({ language: guessed, code, context });
          }}>
          자동 감지
        </button>
      </div>

      <div>
        <label className='block text-sm text-gray-700 mb-1'>코드</label>
        <textarea
          id='review-code-textarea'
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            onChange?.({ language, code: e.target.value, context });
          }}
          onPaste={(e) => {
            // 붙여넣기 즉시 감지: 기본 붙여넣기를 가로채고, 계산된 결과를 반영
            const pasteText = e.clipboardData?.getData('text') || '';
            if (!pasteText) return; // 기본 동작
            e.preventDefault();
            const el = e.target;
            const selStart = el.selectionStart ?? code.length;
            const selEnd = el.selectionEnd ?? code.length;
            const next =
              code.slice(0, selStart) + pasteText + code.slice(selEnd);
            setCode(next);
            const guessed = detectCodeLanguage(next);
            setLanguage(guessed);
            onChange?.({ language: guessed, code: next, context });
          }}
          rows={10}
          placeholder='여기에 코드 붙여넣기'
          className='w-full border rounded p-2 text-sm font-mono'
        />
        <p className='text-[11px] text-gray-500 mt-1'>
          가능하면 줄 번호 힌트를 위해 원본 줄바꿈을 유지하세요.
        </p>
      </div>

      <div>
        <label className='block text-sm text-gray-700 mb-1'>
          컨텍스트(선택)
        </label>
        <textarea
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            onChange?.({ language, code, context: e.target.value });
          }}
          rows={4}
          placeholder='코드의 목적/환경 등을 간략히 설명하세요.'
          className='w-full border rounded p-2 text-sm'
        />
      </div>

      {error && <div className='text-xs text-red-600'>{error}</div>}

      <div className='flex items-center gap-2'>
        <button
          type='submit'
          disabled={loading}
          className='btn-primary disabled:opacity-60'>
          {loading ? '요청 중...' : '리뷰 요청'}
        </button>
        <button
          type='button'
          className='btn-secondary'
          onClick={() => {
            setLanguage('auto');
            setCode('');
            setContext('');
            onChange?.({ language: 'auto', code: '', context: '' });
            setError(null);
          }}>
          초기화
        </button>
      </div>
    </form>
  );
};

export default ReviewRequestForm;
