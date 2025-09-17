// 🔧 SSE 연결 상태 관리
let eventSource = null; // SSE 연결 객체
let isConnected = false; // 현재 연결 상태
let reconnectAttempts = 0; // 재연결 시도 횟수
let maxReconnectAttempts = 5; // 최대 재연결 시도 횟수
let reconnectTimeout = null; // 재연결 타이머

// 🎧 이벤트 리스너들을 저장하는 맵
const eventListeners = new Map();

/**
 * 🔗 SSE 연결을 시작합니다
 *
 * 📝 동작 과정:
 * 1. 백엔드 /api/notifications/subscribe 엔드포인트에 연결
 * 2. JWT 쿠키가 자동으로 전송됨 (인증 처리)
 * 3. 연결 성공 시 이벤트 리스너들을 등록
 * 4. 연결 실패 시 자동 재연결 시도
 *
 * 🎯 언제 호출하나요?
 * - 사용자가 로그인한 후
 * - 앱이 시작될 때
 * - 연결이 끊어졌을 때 재연결용으로
 */
export function connectSSE() {
  // 이미 연결되어 있다면 중복 연결 방지
  if (eventSource && isConnected) {
    console.log('🔗 SSE 이미 연결됨 - 중복 연결 방지');
    return;
  }

  console.log('🔗 SSE 연결 시작...');

  try {
    // 1️⃣ EventSource 객체 생성 (브라우저의 SSE 클라이언트)
    const sseUrl = `/api/notifications/subscribe`;
    eventSource = new EventSource(sseUrl, {
      withCredentials: true, // 쿠키(JWT 토큰) 포함해서 요청
    });

    // 2️⃣ 연결 성공 이벤트 처리
    eventSource.addEventListener('connected', (event) => {
      console.log('✅ SSE 연결 성공:', event.data);
      isConnected = true;
      reconnectAttempts = 0; // 재연결 카운터 초기화

      // 연결 성공을 알림
      notifyListeners('connected', { message: event.data });
    });

    // 3️⃣ 알림 메시지 수신 처리
    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('📱 알림 수신:', notification);

        // 브라우저 알림 표시
        showBrowserNotification(notification);

        // 등록된 리스너들에게 알림 전달
        notifyListeners('notification', notification);
      } catch (error) {
        console.error('❌ 알림 데이터 파싱 실패:', error, event.data);
      }
    });

    // 4️⃣ 하트비트 수신 처리 (연결 유지 확인용)
    eventSource.addEventListener('heartbeat', (event) => {
      try {
        const heartbeat = JSON.parse(event.data);
        console.log('💓 하트비트 수신:', heartbeat.timestamp);

        // 연결 상태를 확인용으로 리스너들에게 알림
        notifyListeners('heartbeat', heartbeat);
      } catch (error) {
        console.error('❌ 하트비트 데이터 파싱 실패:', error);
      }
    });

    // 5️⃣ 연결 테스트 메시지 수신 처리
    eventSource.addEventListener('test', (event) => {
      try {
        const testData = JSON.parse(event.data);
        console.log('🧪 연결 테스트 수신:', testData.message);

        // 테스트 결과를 리스너들에게 알림
        notifyListeners('test', testData);
      } catch (error) {
        console.error('❌ 테스트 데이터 파싱 실패:', error);
      }
    });

    // 6️⃣ 연결 오류 처리
    eventSource.onerror = (error) => {
      console.warn('❌ SSE 연결 오류:', error);
      isConnected = false;

      // 연결이 끊어졌음을 리스너들에게 알림
      notifyListeners('error', { error: 'SSE 연결 오류' });

      // 자동 재연결 시도
      attemptReconnect();
    };

    console.log('🎧 SSE 이벤트 리스너 등록 완료');
  } catch (error) {
    console.error('❌ SSE 연결 실패:', error);
    isConnected = false;

    // 연결 실패를 리스너들에게 알림
    notifyListeners('error', { error: 'SSE 연결 실패' });

    // 재연결 시도
    attemptReconnect();
  }
}

/**
 * 🔌 SSE 연결을 종료합니다
 *
 * 🎯 언제 호출하나요?
 * - 사용자가 로그아웃할 때
 * - 앱을 완전히 종료할 때
 * - 수동으로 연결을 끊고 싶을 때
 */
export function disconnectSSE() {
  console.log('🔌 SSE 연결 종료...');

  // 재연결 타이머가 있다면 취소
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // EventSource 연결 종료
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  isConnected = false;

  console.log('✅ SSE 연결 종료 완료');
}

/**
 * 🔄 자동 재연결을 시도합니다
 *
 * 📝 재연결 전략:
 * - 지수 백오프: 1초 → 2초 → 4초 → 8초 → 16초
 * - 최대 5번까지 시도
 * - 5번 실패하면 재연결 포기
 */
function attemptReconnect() {
  // 이미 연결되어 있거나 최대 시도 횟수를 초과했다면 포기
  if (isConnected || reconnectAttempts >= maxReconnectAttempts) {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('❌ SSE 재연결 포기 (최대 시도 횟수 초과)');
      notifyListeners('reconnectFailed', { attempts: reconnectAttempts });
    }
    return;
  }

  reconnectAttempts++;

  // 지수 백오프: 1초, 2초, 4초, 8초, 16초
  const delay = Math.pow(2, reconnectAttempts - 1) * 1000;

  console.log(
    `🔄 SSE 재연결 시도 ${reconnectAttempts}/${maxReconnectAttempts} (${delay}ms 후)`
  );

  // 연결 종료 후 재연결
  disconnectSSE();

  reconnectTimeout = setTimeout(() => {
    connectSSE();
  }, delay);
}

/**
 * 🎧 SSE 이벤트 리스너를 등록합니다
 *
 * 📝 사용법:
 * // 알림 수신 리스너 등록
 * addSSEListener('notification', (notification) => {
 *   console.log('새 알림:', notification.message);
 * });
 *
 * // 연결 상태 변경 리스너 등록
 * addSSEListener('connected', () => {
 *   console.log('SSE 연결됨!');
 * });
 *
 * @param {string} eventType - 이벤트 타입 ('notification', 'connected', 'error' 등)
 * @param {function} listener - 이벤트 발생 시 호출될 함수
 * @param {string} listenerId - 리스너 식별자 (제거할 때 사용)
 */
export function addSSEListener(eventType, listener, listenerId = null) {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Map());
  }

  const id = listenerId || `listener_${Date.now()}_${Math.random()}`;
  eventListeners.get(eventType).set(id, listener);

  console.log(`🎧 SSE 리스너 등록: ${eventType} (ID: ${id})`);
  return id; // 리스너 ID 반환 (제거할 때 사용)
}

/**
 * 🗑️ SSE 이벤트 리스너를 제거합니다
 *
 * @param {string} eventType - 이벤트 타입
 * @param {string} listenerId - 제거할 리스너 ID
 */
export function removeSSEListener(eventType, listenerId) {
  if (eventListeners.has(eventType)) {
    const removed = eventListeners.get(eventType).delete(listenerId);
    if (removed) {
      console.log(`🗑️ SSE 리스너 제거: ${eventType} (ID: ${listenerId})`);
    }
  }
}

/**
 * 📢 등록된 모든 리스너들에게 이벤트를 알립니다 (내부 함수)
 *
 * @param {string} eventType - 이벤트 타입
 * @param {any} data - 전달할 데이터
 */
function notifyListeners(eventType, data) {
  if (eventListeners.has(eventType)) {
    eventListeners.get(eventType).forEach((listener, listenerId) => {
      try {
        listener(data);
      } catch (error) {
        console.error(
          `❌ SSE 리스너 실행 오류 (${eventType}, ${listenerId}):`,
          error
        );
      }
    });
  }
}

/**
 * 📱 브라우저 알림을 표시합니다
 *
 * 📝 동작 과정:
 * 1. 알림 권한이 있는지 확인
 * 2. 권한이 있다면 브라우저 알림 표시
 * 3. 권한이 없다면 콘솔에만 로그
 *
 * @param {Object} notification - 알림 데이터
 */
function showBrowserNotification(notification) {
  console.log('🔔 브라우저 알림 표시 시도:', notification);

  // 브라우저가 Notification API를 지원하는지 확인
  if (!('Notification' in window)) {
    console.warn('⚠️ 이 브라우저는 알림을 지원하지 않습니다');
    return;
  }

  console.log('📋 현재 알림 권한 상태:', Notification.permission);

  // 알림 권한이 허용되어 있는지 확인
  if (Notification.permission !== 'granted') {
    console.log(
      '🔕 알림 권한이 없어서 브라우저 알림을 표시할 수 없습니다. 현재 권한:',
      Notification.permission
    );
    return;
  }

  // 페이지가 포커스되어 있는지 확인 (일부 브라우저는 포커스된 탭에서는 알림을 표시하지 않음)
  if (!document.hidden) {
    console.log(
      '📺 현재 탭이 활성화되어 있어서 브라우저 알림을 생략합니다 (백그라운드일 때만 표시)'
    );
    // 테스트를 위해 주석 처리 - 실제로는 활성 탭에서도 알림을 보여줄 수 있음
    // return;
  }

  // 알림 제목과 내용 준비
  let title = '스터디메이트';
  let body = notification.message || '새로운 알림이 있습니다';
  let icon = '/vite.svg'; // 알림 아이콘

  // 알림 타입별로 제목 커스터마이징
  switch (notification.type) {
    case 'CHAT_MESSAGE':
      title = `💬 ${notification.nickname}님의 메시지`;
      break;
    case 'USER_JOIN':
      title = `👋 ${notification.nickname}님 입장`;
      break;
    case 'USER_LEAVE':
      title = `👋 ${notification.nickname}님 퇴장`;
      break;
    case 'PRESENCE_UPDATE':
      title = `📊 ${notification.nickname}님 상태 변경`;
      break;
    default:
      title = '📢 스터디메이트 알림';
  }

  console.log('📝 알림 내용 준비:', {
    title,
    body,
    icon,
    type: notification.type,
  });

  try {
    // 브라우저 알림 생성
    const browserNotification = new Notification(title, {
      body: body,
      icon: icon,
      badge: icon,
      tag: `notification_${notification.type}_${Date.now()}`, // 중복 알림 방지
      requireInteraction: false, // 자동으로 사라지게 함
      silent: false, // 알림음 재생
      vibrate: [200, 100, 200], // 진동 (모바일)
    });

    console.log('✅ 브라우저 알림 생성 성공:', browserNotification);

    // 알림 이벤트 리스너 등록
    browserNotification.onshow = function () {
      console.log('📱 브라우저 알림이 표시되었습니다');
    };

    browserNotification.onerror = function (error) {
      console.error('❌ 브라우저 알림 표시 오류:', error);
    };

    browserNotification.onclose = function () {
      console.log('🔒 브라우저 알림이 닫혔습니다');
    };

    // 알림 클릭 시 창을 포커스
    browserNotification.onclick = function () {
      console.log('👆 브라우저 알림 클릭됨');
      window.focus();
      this.close();
    };

    // 5초 후 자동으로 알림 닫기 (3초에서 5초로 연장)
    setTimeout(() => {
      browserNotification.close();
      console.log('⏰ 브라우저 알림 자동 닫기 (5초 후)');
    }, 5000);

    console.log('📱 브라우저 알림 설정 완료:', title, body);
  } catch (error) {
    console.error('❌ 브라우저 알림 생성 실패:', error);
  }
}

/**
 * 🔔 브라우저 알림 권한을 요청합니다
 *
 * 📝 사용법:
 * const granted = await requestNotificationPermission();
 * if (granted) {
 *   console.log('알림 권한 허용됨!');
 * }
 *
 * @returns {Promise<boolean>} 권한 허용 여부
 */
export async function requestNotificationPermission() {
  // 브라우저가 Notification API를 지원하는지 확인
  if (!('Notification' in window)) {
    console.warn('⚠️ 이 브라우저는 알림을 지원하지 않습니다');
    return false;
  }

  // 이미 권한이 허용되어 있다면
  if (Notification.permission === 'granted') {
    console.log('✅ 알림 권한이 이미 허용되어 있습니다');
    return true;
  }

  // 권한이 거부되어 있다면
  if (Notification.permission === 'denied') {
    console.warn(
      '❌ 알림 권한이 거부되어 있습니다 (브라우저 설정에서 변경 필요)'
    );
    return false;
  }

  try {
    // 사용자에게 권한 요청
    console.log('🔔 브라우저 알림 권한 요청...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ 알림 권한이 허용되었습니다!');

      // 테스트 알림 표시
      new Notification('🎉 알림 설정 완료!', {
        body: '이제 실시간 알림을 받을 수 있습니다.',
        icon: '/vite.svg',
      });

      return true;
    } else {
      console.warn('❌ 알림 권한이 거부되었습니다');
      return false;
    }
  } catch (error) {
    console.error('❌ 알림 권한 요청 실패:', error);
    return false;
  }
}

/**
 * 📊 현재 SSE 연결 상태를 반환합니다
 *
 * @returns {Object} 연결 상태 정보
 */
export function getSSEStatus() {
  return {
    isConnected,
    reconnectAttempts,
    maxReconnectAttempts,
    hasEventSource: !!eventSource,
    notificationPermission:
      'Notification' in window ? Notification.permission : 'not-supported',
  };
}

/**
 * 🧪 SSE 연결 테스트를 요청합니다 (개발/디버깅용)
 *
 * 📝 사용법:
 * const result = await testSSEConnection();
 * console.log('테스트 결과:', result);
 *
 * @returns {Promise<Object>} 테스트 결과
 */
export async function testSSEConnection() {
  try {
    const response = await fetch(`/api/notifications/test`, {
      method: 'POST',
      credentials: 'include', // 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('🧪 SSE 연결 테스트 결과:', result);
    return result;
  } catch (error) {
    console.error('❌ SSE 연결 테스트 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 🧪 브라우저 알림 테스트 (개발/디버깅용)
 *
 * 실제 SSE 이벤트 없이 브라우저 알림만 테스트합니다.
 * 권한 확인 및 알림 표시 문제를 디버깅할 때 사용합니다.
 *
 * @param {string} type - 테스트할 알림 타입 (기본값: 'test')
 * @returns {boolean} 테스트 성공 여부
 */
export function testBrowserNotification(type = 'test') {
  console.log('🧪 브라우저 알림 테스트 시작:', type);

  // 테스트용 알림 데이터 생성
  const testNotification = {
    type: type,
    roomId: 1,
    providerId: 'test-user',
    nickname: '테스트사용자',
    message: '브라우저 알림 테스트입니다!',
    timestamp: new Date().toISOString(),
    data: { status: 'STUDYING' },
  };

  try {
    // 브라우저 알림 표시 시도
    showBrowserNotification(testNotification);
    console.log('✅ 브라우저 알림 테스트 완료');
    return true;
  } catch (error) {
    console.error('❌ 브라우저 알림 테스트 실패:', error);
    return false;
  }
}

/**
 * 🔧 알림 시스템 진단 (개발/디버깅용)
 *
 * 브라우저 환경, 권한 상태, SSE 연결 등을 종합적으로 체크합니다.
 *
 * @returns {Object} 진단 결과
 */
export function diagnoseNotificationSystem() {
  const diagnosis = {
    browser: {
      supportsNotification: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    },
    notification: {
      permission:
        'Notification' in window ? Notification.permission : 'not-supported',
      maxActions:
        'Notification' in window && 'maxActions' in Notification
          ? Notification.maxActions
          : 'unknown',
    },
    document: {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      hasFocus: document.hasFocus(),
    },
    sse: getSSEStatus(),
  };

  console.log('🔍 알림 시스템 진단 결과:', diagnosis);

  // 문제점 분석
  const issues = [];

  if (!diagnosis.browser.supportsNotification) {
    issues.push('브라우저가 Notification API를 지원하지 않습니다');
  }

  if (diagnosis.notification.permission === 'denied') {
    issues.push('알림 권한이 거부되었습니다 (브라우저 설정에서 변경 필요)');
  }

  if (diagnosis.notification.permission === 'default') {
    issues.push('알림 권한을 아직 요청하지 않았습니다');
  }

  if (!diagnosis.sse.isConnected) {
    issues.push('SSE 연결이 되어있지 않습니다');
  }

  if (issues.length > 0) {
    console.warn('⚠️ 발견된 문제점들:', issues);
  } else {
    console.log('✅ 알림 시스템이 정상적으로 설정되어 있습니다');
  }

  diagnosis.issues = issues;
  return diagnosis;
}

// 🔧 개발/디버깅을 위해 전역 객체에 테스트 함수들을 노출
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.notificationDebug = {
    testSSE: testSSEConnection,
    testNotification: testBrowserNotification,
    diagnose: diagnoseNotificationSystem,
    getStatus: getSSEStatus,
    requestPermission: requestNotificationPermission,
  };
  console.log('🔧 개발모드: window.notificationDebug 객체가 등록되었습니다');
  console.log(
    '사용법: window.notificationDebug.testNotification() 또는 window.notificationDebug.diagnose()'
  );
}
