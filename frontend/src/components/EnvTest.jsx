const EnvTest = () => {
  const envVars = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_APP_DEBUG: import.meta.env.VITE_APP_DEBUG,
    MODE: import.meta.env.MODE,
  };

  return (
    <div className='p-6 bg-yellow-50 rounded-lg border border-yellow-200'>
      <h3 className='text-lg font-semibold text-yellow-800 mb-4'>
        환경변수 설정 확인
      </h3>

      <div className='space-y-2 text-sm'>
        {Object.entries(envVars).map(([key, value]) => (
          <div
            key={key}
            className='flex justify-between items-center'>
            <span className='font-mono text-yellow-700'>{key}:</span>
            <span className='font-mono text-yellow-900 bg-yellow-100 px-2 py-1 rounded'>
              {value || 'undefined'}
            </span>
          </div>
        ))}
      </div>

      <div className='mt-4 p-3 bg-yellow-100 rounded border border-yellow-300'>
        <p className='text-sm text-yellow-800'>
          <strong>💡 팁:</strong> .env 파일을 생성하여 환경변수를 설정하세요!
        </p>
        <p className='text-xs text-yellow-700 mt-1'>
          env.example 파일을 참고하여 .env 파일을 만들어보세요.
        </p>
      </div>
    </div>
  );
};

export default EnvTest;
