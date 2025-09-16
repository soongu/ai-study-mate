// 이 파일은 화면 우측 하단에 떠 있는(플로팅) "AI Assistant" 패널입니다.
// - 드래그로 위치를 옮길 수 있고
// - 접기/열기 토글로 최소화할 수 있습니다.
import React, { useRef, useState, useEffect } from 'react';

const AIAssistantPanel = () => {
  // 패널의 실제 DOM 요소에 접근하기 위한 참조입니다.
  // (드래그 시 현재 박스의 크기/위치를 읽거나, 이벤트 기준점을 잡는 데 사용)
  const panelRef = useRef(null);

  // 패널이 최소화(접힘) 상태인지 저장합니다.
  const [isMinimized, setIsMinimized] = useState(false);

  // 패널의 현재 화면 위치(왼쪽에서 x, 위에서 y 픽셀)를 상태로 저장합니다.
  const [position, setPosition] = useState({ x: 24, y: 24 });

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
        // 본문 영역. 다음 커밋들에서 실제 채팅 UI가 들어갈 공간입니다.
        <div className='p-3 h-[calc(100%-40px)]'>
          <div className='text-sm text-gray-600'>
            여기에 채팅 UI가 들어갑니다
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
