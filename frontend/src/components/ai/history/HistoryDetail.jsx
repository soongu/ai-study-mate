import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

// HistoryDetail: 우측 상세 영역(스레드)
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

const stripContext = (text) => {
  if (!text) return '';
  let t = String(text);
  t = t.replace(/\[대화 문맥\][\s\S]*?(?=\n\[[^\n]+\]|$)/g, '');
  t = t.replace(/\[컨텍스트\][\s\S]*?(?=\n\[[^\n]+\]|$)/g, '');
  return t.trim();
};

const extractQuestion = (text) => {
  if (!text) return '';
  const stripped = stripContext(text);
  const m = stripped.match(/\[질문\]\s*([\s\S]*?)(?=\n\[[^\n]+\]|$)/);
  if (m && m[1]) return m[1].trim();
  return stripped;
};

const mdComponents = {
  ul: (props) => <ul className='list-disc pl-5 my-2'>{props.children}</ul>,
  ol: (props) => <ol className='list-decimal pl-5 my-2'>{props.children}</ol>,
};

const HistoryDetail = ({ item }) => {
  if (!item) {
    return (
      <div className='text-xs text-gray-500'>좌측에서 항목을 선택하세요.</div>
    );
  }

  // 스레드 항목(children) 렌더링
  const children = item.children || [];
  if (!children.length) {
    return (
      <div className='space-y-2'>
        <div className='text-xs text-gray-500'>
          이 대화에 표시할 항목이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-[11px] px-1 rounded border bg-gray-50'>
            대화 스레드
          </span>
          <span className='text-[11px] text-gray-500'>
            {formatDateTime(item.createdAt)}
          </span>
        </div>
      </div>

      <div className='space-y-4'>
        {children.map((c) => (
          <div
            key={c.id}
            className='space-y-3'>
            <div className='flex items-center gap-2'>
              <span className='text-[11px] px-1 rounded border bg-gray-50'>
                {c.type || '-'}
              </span>
              <span className='text-[10px] text-gray-500'>
                {formatDateTime(c.createdAt)}
              </span>
            </div>

            {/* 사용자 질문 카드 */}
            <div className='rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-2 shadow-sm'>
              <div className='mb-1 flex items-center gap-2'>
                <span className='text-[10px] font-medium text-indigo-700 bg-white/60 border border-indigo-200 rounded px-1.5 py-0.5'>
                  User
                </span>
                <span className='text-[11px] text-indigo-700'>사용자 질문</span>
              </div>
              <div className='prose prose-sm max-w-none prose-pre:my-2 prose-code:before:content-[none] prose-code:after:content-[none]'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={mdComponents}>
                  {extractQuestion(c.prompt || '')}
                </ReactMarkdown>
              </div>
            </div>

            {/* 구분선 */}
            <div className='h-2' />

            {/* AI 응답 카드 */}
            <div className='rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 shadow-sm'>
              <div className='mb-1 flex items-center gap-2'>
                <span className='text-[10px] font-medium text-emerald-700 bg-white/60 border border-emerald-200 rounded px-1.5 py-0.5'>
                  AI
                </span>
                <span className='text-[11px] text-emerald-700'>AI 응답</span>
              </div>
              <div className='prose prose-sm max-w-none prose-pre:my-2 prose-code:before:content-[none] prose-code:after:content-[none]'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={mdComponents}>
                  {c.response || ''}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryDetail;
