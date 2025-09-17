import React from 'react';

const StatusToggle = ({ current, disabled, onChange }) => {
  return (
    <div className='card p-3'>
      <p className='text-sm font-medium text-gray-900'>나의 상태</p>
      <div className='mt-2 flex flex-wrap gap-2'>
        {['ONLINE', 'STUDYING', 'BREAK'].map((s) => (
          <button
            key={s}
            type='button'
            className={`px-3 py-1 rounded-full border text-xs ${
              current === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } disabled:opacity-60`}
            disabled={disabled}
            onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
      <p className='mt-2 text-[11px] text-gray-500'>
        탭이 활성화된 동안 15초 간격으로 하트비트를 전송합니다.
      </p>
    </div>
  );
};

export default StatusToggle;
