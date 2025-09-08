import TailwindTest from './components/TailwindTest';
import CorsTest from './components/CorsTest';
import EnvTest from './components/EnvTest';

const App = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            AI Study Mate
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            Tailwind CSS가 성공적으로 설정되었습니다! 🎉
          </p>

          {/* Tailwind CSS 테스트 컴포넌트들 */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
            <div className='card-hover'>
              <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <span className='text-primary-600 text-xl'>🎨</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                유틸리티 클래스
              </h3>
              <p className='text-gray-600 text-sm'>
                빠르고 일관된 스타일링을 위한 유틸리티 클래스
              </p>
            </div>

            <div className='card-hover'>
              <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <span className='text-secondary-600 text-xl'>⚡</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                빠른 개발
              </h3>
              <p className='text-gray-600 text-sm'>
                CSS 작성 없이 HTML에서 바로 스타일링
              </p>
            </div>

            <div className='card-hover'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <span className='text-green-600 text-xl'>📱</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                반응형 디자인
              </h3>
              <p className='text-gray-600 text-sm'>
                모바일부터 데스크톱까지 완벽한 반응형
              </p>
            </div>
          </div>

          {/* 버튼 테스트 */}
          <div className='flex flex-wrap justify-center gap-4 mt-8'>
            <button className='btn-primary'>Primary Button</button>
            <button className='btn-secondary'>Secondary Button</button>
            <button className='btn-outline'>Outline Button</button>
          </div>

          {/* 입력 필드 테스트 */}
          <div className='max-w-md mx-auto mt-8'>
            <input
              type='text'
              placeholder='Tailwind CSS 입력 필드 테스트'
              className='input-field'
            />
          </div>

          {/* 애니메이션 테스트 */}
          <div className='mt-8'>
            <div className='inline-block animate-bounce-gentle'>
              <span className='text-2xl'>🎯</span>
            </div>
          </div>

          {/* Tailwind 테스트 컴포넌트 */}
          <div className='mt-12 max-w-2xl mx-auto'>
            <TailwindTest />
          </div>

          {/* CORS 테스트 컴포넌트 */}
          <div className='mt-8 max-w-2xl mx-auto'>
            <CorsTest />
          </div>

          {/* 환경변수 테스트 컴포넌트 */}
          <div className='mt-8 max-w-2xl mx-auto'>
            <EnvTest />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
