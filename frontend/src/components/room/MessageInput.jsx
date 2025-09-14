import React, { useCallback, useState } from 'react';

/**
 * MessageInput
 * - Enter 전송, Shift+Enter 줄바꿈
 */
const MessageInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');

  const handleKeyDown = useCallback(
    (e) => {
      // 한글/일본어 등 IME 입력 중 Enter로 조합 확정 시 중복 전송을 막기 위한 가드
      const isComposing =
        e.isComposing || (e.nativeEvent && e.nativeEvent.isComposing);
      if (isComposing) return;

      // 일부 브라우저는 IME 조합 중 keyCode 229를 사용 → 이 경우도 전송하지 않음
      if (e.keyCode === 229) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!value.trim()) return;
        onSend?.(value.trim());
        setValue('');
      }
    },
    [value, onSend]
  );

  const handleClick = () => {
    if (!value.trim()) return;
    onSend?.(value.trim());
    setValue('');
  };

  return (
    <div className='border-t p-2 flex items-end gap-2'>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='메시지를 입력하세요'
        className='flex-1 resize-none border rounded px-3 py-2 text-sm h-12'
        disabled={disabled}
      />
      <button
        type='button'
        className='btn-primary'
        onClick={handleClick}
        disabled={disabled || !value.trim()}>
        전송
      </button>
    </div>
  );
};

export default MessageInput;
