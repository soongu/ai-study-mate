import { useState } from 'react';
import apiClient from '../services/apiClient';

const CorsTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testCors = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 백엔드 헬스체크 API 호출
      const response = await apiClient.get('/health');
      setResult({
        success: true,
        message: 'CORS 연결 성공!',
        data: response.data,
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'CORS 연결 실패',
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 bg-blue-50 rounded-lg border border-blue-200'>
      <h3 className='text-lg font-semibold text-blue-800 mb-4'>
        CORS 및 프록시 테스트
      </h3>

      <button
        onClick={testCors}
        disabled={loading}
        className='btn-primary disabled:opacity-50'>
        {loading ? '테스트 중...' : '헬스체크 API 테스트'}
      </button>

      {result && (
        <div
          className={`mt-4 p-3 rounded ${
            result.success
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
          <p className='font-medium'>{result.message}</p>
          {result.data && (
            <pre className='mt-2 text-sm bg-white p-2 rounded border'>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
          {result.error && <p className='mt-2 text-sm'>{result.error}</p>}
        </div>
      )}

      <div className='mt-4 text-sm text-blue-700'>
        <p>• 프론트엔드: http://localhost:3000</p>
        <p>• 백엔드: http://localhost:9005</p>
        <p>• 프록시: /api → 백엔드로 전달</p>
      </div>
    </div>
  );
};

export default CorsTest;
