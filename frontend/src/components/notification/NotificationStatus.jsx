/**
 * 🔔 SSE 알림 상태 표시 컴포넌트
 *
 * 설명:
 * - 현재 SSE 연결 상태를 시각적으로 보여줍니다
 * - 알림 권한 상태도 함께 표시합니다
 * - 개발자도구나 디버깅용으로 유용합니다
 */

import React, { useState, useEffect } from 'react';
import {
  getSSEStatus,
  addSSEListener,
  removeSSEListener,
  testSSEConnection,
  testBrowserNotification,
  diagnoseNotificationSystem,
} from '../../services/notificationService.js';

const NotificationStatus = () => {
  const [status, setStatus] = useState(getSSEStatus());
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isNotificationTestLoading, setIsNotificationTestLoading] =
    useState(false);

  // SSE 상태 업데이트를 위한 리스너 등록
  useEffect(() => {
    // 상태 업데이트 함수
    const updateStatus = () => {
      setStatus(getSSEStatus());
    };

    // 각종 SSE 이벤트에 리스너 등록
    const connectedListenerId = addSSEListener('connected', updateStatus);
    const errorListenerId = addSSEListener('error', updateStatus);
    const heartbeatListenerId = addSSEListener('heartbeat', updateStatus);

    // 1초마다 상태 업데이트 (연결 상태 실시간 반영)
    const interval = setInterval(updateStatus, 1000);

    // 컴포넌트 언마운트 시 정리
    return () => {
      removeSSEListener('connected', connectedListenerId);
      removeSSEListener('error', errorListenerId);
      removeSSEListener('heartbeat', heartbeatListenerId);
      clearInterval(interval);
    };
  }, []);

  // SSE 연결 테스트 함수
  const handleTestConnection = async () => {
    setIsTestLoading(true);
    try {
      const result = await testSSEConnection();
      if (result.success) {
        alert('✅ SSE 연결 테스트 성공!');
      } else {
        alert(`❌ SSE 연결 테스트 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      alert(`❌ SSE 연결 테스트 실패: ${error.message}`);
    } finally {
      setIsTestLoading(false);
    }
  };

  // 브라우저 알림 테스트 함수
  const handleTestNotification = async () => {
    setIsNotificationTestLoading(true);
    try {
      // 진단 먼저 실행
      const diagnosis = diagnoseNotificationSystem();

      if (diagnosis.issues.length > 0) {
        alert(`⚠️ 알림 시스템 문제 발견:\n${diagnosis.issues.join('\n')}`);
        return;
      }

      // 브라우저 알림 테스트
      const success = testBrowserNotification('CHAT_MESSAGE');

      if (success) {
        alert(
          '✅ 브라우저 알림 테스트 완료!\n콘솔을 확인해서 알림이 표시되었는지 확인해주세요.'
        );
      } else {
        alert(
          '❌ 브라우저 알림 테스트 실패!\n콘솔을 확인해서 오류를 확인해주세요.'
        );
      }
    } catch (error) {
      alert(`❌ 브라우저 알림 테스트 실패: ${error.message}`);
    } finally {
      setIsNotificationTestLoading(false);
    }
  };

  // 연결 상태에 따른 색상 및 텍스트
  const getConnectionStatus = () => {
    if (status.isConnected) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '🟢',
        text: '연결됨',
      };
    } else if (status.reconnectAttempts > 0) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '🟡',
        text: `재연결 중 (${status.reconnectAttempts}/${status.maxReconnectAttempts})`,
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '🔴',
        text: '연결 안됨',
      };
    }
  };

  // 알림 권한에 따른 색상 및 텍스트
  const getNotificationStatus = () => {
    switch (status.notificationPermission) {
      case 'granted':
        return {
          color: 'text-green-600',
          icon: '🔔',
          text: '허용됨',
        };
      case 'denied':
        return {
          color: 'text-red-600',
          icon: '🔕',
          text: '거부됨',
        };
      case 'default':
        return {
          color: 'text-yellow-600',
          icon: '❓',
          text: '미설정',
        };
      default:
        return {
          color: 'text-gray-600',
          icon: '❌',
          text: '지원 안됨',
        };
    }
  };

  const connectionStatus = getConnectionStatus();
  const notificationStatus = getNotificationStatus();

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-3'>
      <h3 className='text-lg font-semibold text-gray-900 mb-3'>
        🔔 알림 시스템 상태
      </h3>

      {/* SSE 연결 상태 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-lg'>{connectionStatus.icon}</span>
          <span className='font-medium text-gray-700'>SSE 연결:</span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${connectionStatus.bgColor} ${connectionStatus.color}`}>
          {connectionStatus.text}
        </span>
      </div>

      {/* 브라우저 알림 권한 상태 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <span className='text-lg'>{notificationStatus.icon}</span>
          <span className='font-medium text-gray-700'>브라우저 알림:</span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium bg-gray-50 ${notificationStatus.color}`}>
          {notificationStatus.text}
        </span>
      </div>

      {/* 상세 정보 */}
      <div className='mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1'>
        <div>EventSource: {status.hasEventSource ? '생성됨' : '없음'}</div>
        {status.reconnectAttempts > 0 && (
          <div>
            재연결 시도: {status.reconnectAttempts}/
            {status.maxReconnectAttempts}
          </div>
        )}
      </div>

      {/* 테스트 버튼들 */}
      <div className='space-y-2'>
        {/* SSE 연결 테스트 */}
        <button
          onClick={handleTestConnection}
          disabled={isTestLoading || !status.isConnected}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            status.isConnected && !isTestLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          {isTestLoading ? '테스트 중...' : '🧪 SSE 연결 테스트'}
        </button>

        {/* 브라우저 알림 테스트 */}
        <button
          onClick={handleTestNotification}
          disabled={isNotificationTestLoading}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            !isNotificationTestLoading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          {isNotificationTestLoading
            ? '테스트 중...'
            : '📱 브라우저 알림 테스트'}
        </button>
      </div>

      {/* 도움말 */}
      <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
        <p className='text-sm text-blue-800'>
          <strong>💡 알림 시스템 안내:</strong>
        </p>
        <ul className='text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside'>
          <li>SSE 연결이 되어야 실시간 알림을 받을 수 있습니다</li>
          <li>
            브라우저 알림 권한을 허용하면 탭이 백그라운드에 있어도 알림을
            받습니다
          </li>
          <li>연결이 끊어지면 자동으로 재연결을 시도합니다</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationStatus;
