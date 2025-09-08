const TailwindTest = () => {
  return (
    <div className='p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl'>
      <h2 className='text-2xl font-bold text-gray-800 mb-4'>
        Tailwind CSS 테스트 컴포넌트
      </h2>

      <div className='space-y-4'>
        <div className='flex items-center space-x-4'>
          <div className='w-4 h-4 bg-red-500 rounded-full'></div>
          <span className='text-gray-700'>빨간색 원</span>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='w-4 h-4 bg-green-500 rounded-full'></div>
          <span className='text-gray-700'>초록색 원</span>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='w-4 h-4 bg-blue-500 rounded-full'></div>
          <span className='text-gray-700'>파란색 원</span>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-2 gap-4'>
        <button className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors'>
          호버 효과
        </button>
        <button className='bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors'>
          회색 버튼
        </button>
      </div>

      <div className='mt-6 p-4 bg-white rounded-lg shadow-md'>
        <h3 className='text-lg font-semibold text-gray-800 mb-2'>
          카드 컴포넌트
        </h3>
        <p className='text-gray-600'>
          Tailwind CSS의 유틸리티 클래스로 만든 간단한 카드입니다.
        </p>
      </div>
    </div>
  );
};

export default TailwindTest;
