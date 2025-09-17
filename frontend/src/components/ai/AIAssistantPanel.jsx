// 이 파일은 화면 우측 하단에 떠 있는(플로팅) "AI Assistant" 패널입니다.
// - 드래그로 위치를 옮길 수 있고
// - 접기/열기 토글로 최소화할 수 있습니다.
import React, { useRef, useState, useEffect } from 'react';
import useAIStore from '../../stores/aiStore';
// react-markdown: 문자열을 안전하게 마크다운으로 렌더링(GFM 플러그인과 함께 사용)
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIAssistantPanel = () => {
  // 패널의 실제 DOM 요소에 접근하기 위한 참조입니다.
  // (드래그 시 현재 박스의 크기/위치를 읽거나, 이벤트 기준점을 잡는 데 사용)
  const panelRef = useRef(null);

  // 패널이 최소화(접힘) 상태인지 저장합니다.
  const [isMinimized, setIsMinimized] = useState(false);

  // 패널의 현재 화면 위치(왼쪽에서 x, 위에서 y 픽셀)를 상태로 저장합니다.
  const [position, setPosition] = useState({ x: 24, y: 24 });

  // 메시지 리스트 컨테이너 참조 (자동 스크롤 하단 이동용)
  const listRef = useRef(null);

  // 드래그하는 중인지 여부와 드래그 시작 지점과의 오프셋을 저장합니다.
  // useRef를 쓰는 이유: 드래그 중에는 값이 매우 자주 바뀌는데,
  // 이 값들은 화면을 다시 그릴 필요가 없기 때문입니다.(성능/불필요 렌더 방지)
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  // 최초 렌더링 시(처음 화면에 등장했을 때)
  // 현재 창의 크기와 패널의 크기를 계산해서, 우측 하단(24px 여백)에 배치합니다.
  useEffect(() => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const margin = 24;
    const x = Math.max(margin, window.innerWidth - rect.width - margin);
    const y = Math.max(margin, window.innerHeight - rect.height - margin);
    setPosition({ x, y });
  }, []);

  // 헤더(상단 바)를 누르는 순간 드래그를 시작합니다.
  const onMouseDown = (e) => {
    if (!panelRef.current) return;
    dragState.current.dragging = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current.offsetX = e.clientX - rect.left;
    dragState.current.offsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 마우스를 움직일 때마다, 시작 지점과의 차이를 이용해 패널 위치를 업데이트합니다.
  const onMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    setPosition({
      x: Math.max(8, e.clientX - dragState.current.offsetX),
      y: Math.max(8, e.clientY - dragState.current.offsetY),
    });
  };

  // 마우스를 떼면 드래그를 종료하고, 등록했던 이벤트를 해제합니다.
  const onMouseUp = () => {
    dragState.current.dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // Zustand 상태와 액션 가져오기
  const { messages, isLoading, error, sendQuestion } = useAIStore();

  // 입력 상태
  const [input, setInput] = useState('');

  // 메시지가 추가될 때마다 하단으로 자동 스크롤합니다.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  // 전송을 한 곳에서만 처리하여 중복 전송을 방지합니다.
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendQuestion(text);
    setInput('');
  };

  return (
    // 실제로 화면에 보이는 패널 박스입니다. 'fixed'는 스크롤과 무관하게 화면 위치를 고정합니다.
    <div
      ref={panelRef}
      className='fixed z-50 bg-white shadow-xl rounded-xl border border-gray-200'
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 360 : 420,
        height: isMinimized ? 56 : 520,
      }}>
      {/* 상단 바(헤더). 여기서 마우스를 누르고 움직이면 onMouseDown → onMouseMove 로 패널이 이동합니다. */}
      <div
        className='cursor-move select-none flex items-center justify-between px-3 py-2 border-b'
        onMouseDown={onMouseDown}>
        <div className='text-sm font-semibold'>AI Assistant</div>
        {/* 접기/열기 버튼. 최소화 상태를 토글하여 본문을 숨겼다가 보여줍니다. */}
        <button
          className='text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200'
          onClick={() => setIsMinimized((v) => !v)}>
          {isMinimized ? '열기' : '접기'}
        </button>
      </div>
      {!isMinimized && (
        // 본문 영역: 메시지 리스트 + 입력폼
        <div
          className='p-3 h-[calc(100%-40px)] flex flex-col gap-2'
          aria-label='AI 대화 영역'>
          <div
            ref={listRef}
            className='flex-1 overflow-auto space-y-2 pr-1'
            role='log'
            aria-live='polite'
            aria-relevant='additions'
            aria-label='AI와의 대화 메시지 목록'>
            {messages.length === 0 && (
              <div className='text-xs text-gray-500'>
                처음 질문을 입력해보세요. 예) "배열과 리스트 차이 설명해줘"
              </div>
            )}
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={
                    'flex w-full ' + (isUser ? 'justify-end' : 'justify-start')
                  }>
                  <div
                    className={
                      (isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm') +
                      ' max-w-[80%] px-3 py-2 rounded-2xl break-words'
                    }>
                    {isUser ? (
                      <div className='whitespace-pre-wrap text-sm'>
                        {m.content}
                      </div>
                    ) : (
                      // react-markdown로 AI 메시지를 마크다운으로 렌더링합니다.
                      // - prose: Tailwind Typography로 기본 마크다운 스타일 적용
                      // - 코드블록/인라인코드 가독성 향상을 위한 유틸 클래스 포함
                      // - 보안: 기본적으로 HTML 태그는 렌더링되지 않으므로 스크립트 삽입 위험이 낮습니다.
                      <div className='prose prose-sm max-w-none prose-pre:my-0 prose-code:before:content-[none] prose-code:after:content-[none]'>
                        <ReactMarkdown
                          // GFM(표, 체크박스 목록, 테이블, 취소선 등) 지원
                          remarkPlugins={[remarkGfm]}
                          // 특정 요소의 렌더 방식을 커스터마이징합니다.
                          // - code: 인라인 코드와 코드펜스를 구분하여 각각 스타일 적용
                          // - a: 외부 링크는 새 탭으로 열고 기본 밑줄/색상을 지정
                          components={{
                            code({ inline, className, children, ...props }) {
                              if (inline) {
                                return (
                                  <code
                                    className='px-1 py-[1px] rounded bg-gray-200 text-gray-800 font-mono text-[12px]'
                                    {...props}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className='bg-gray-900 text-gray-100 text-xs rounded p-2 overflow-auto'>
                                  <code
                                    className={className}
                                    {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                            a({ href, children, ...props }) {
                              return (
                                <a
                                  href={href}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='underline text-indigo-600'
                                  {...props}>
                                  {children}
                                </a>
                              );
                            },
                          }}>
                          {m.content || ''}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className='text-xs text-red-600 border border-red-200 bg-red-50 p-2 rounded'>
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => e.preventDefault()}
            className='flex items-start gap-2'
            aria-label='AI 질문 입력 폼'>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // 한글 등 IME 조합 중 엔터는 전송하지 않습니다.
                const composing = e.isComposing || e.nativeEvent?.isComposing;
                if (composing) return;
                // 일부 브라우저(IME 조합)에서 keyCode 229가 들어오는 경우도 전송하지 않습니다.
                if (e.keyCode === 229) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label='AI 질문 입력'
              aria-describedby='ai-input-help'
              placeholder='질문을 입력하세요 (Shift+Enter 줄바꿈)'
              rows={2}
              className='flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300'
            />
            <span
              id='ai-input-help'
              className='sr-only'>
              Enter 키로 전송, Shift+Enter는 줄바꿈입니다.
            </span>
            <button
              type='button'
              onClick={handleSend}
              disabled={isLoading}
              aria-label='질문 전송'
              title='질문 전송'
              className='px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'>
              {isLoading ? '전송중...' : '보내기'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
