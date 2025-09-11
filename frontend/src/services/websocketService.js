/**
 * WebSocket + STOMP 클라이언트
 *
 * 이 파일은 브라우저에서 백엔드 STOMP 엔드포인트(`/ws`)에 연결하는
 * 아주 작은 도우미입니다. 실제 채팅 메시지 주고받기는 다음 커밋에서 붙이고,
 * 여기서는 "연결(connect) / 해제(disconnect) + 자동 재연결"만 다룹니다.
 *
 * WebSocket이 뭔가요?
 * - 웹 브라우저와 서버가 전화기를 붙잡고 있는 것처럼 "계속 연결"된 상태를 유지해요.
 * - 그래서 서버가 먼저 말을 걸 수도 있고, 클라이언트도 바로바로 보낼 수 있어요.
 *
 * STOMP가 뭔가요?
 * - WebSocket 위에서 "메시지를 어떤 주소로 보내고, 어떤 주소를 구독해서 받을지"를
 *   약속한 간단한 규칙(프로토콜)입니다. (예: '/app/rooms/1/chat'으로 보내고,
 *   '/topic/rooms/1'을 구독해서 받기)
 *
 * 구현 원칙
 * - 자동 재연결: 네트워크가 잠깐 끊겨도 다시 붙도록 합니다(지수 백오프).
 * - React 19: 컴포넌트 바깥(모듈 스코프)에서 상태를 관리해 불필요한 리렌더를 줄입니다.
 */

// STOMP 클라이언트: STOMP 규칙을 쉽게 사용할 수 있게 해주는 도구
import { Client } from '@stomp/stompjs';

/**
 * WebSocket 서버 주소를 환경 변수에서 읽어옵니다.
 * - 개발: 보통 'ws://localhost:9005/ws' 형태 (ws = 보안 X)
 * - 운영(HTTPS): 'wss://your-domain/ws' 형태 (wss = 보안 O)
 *
 * .env 설정 예시는 'frontend/env.example' 파일을 참고하세요.
 */
const WS_URL = import.meta.env.VITE_WS_URL;

/**
 * 연결 상태 값(문자열) 모음입니다.
 * - DISCONNECTED: 아직 연결되지 않았거나, 끊긴 상태
 * - CONNECTING: 지금 연결을 시도하는 중
 * - CONNECTED: 연결이 성공해 사용 가능한 상태
 */
export const ConnectionState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
};

// MVP 단계 메모: 현재는 "연결/해제"만 제공하고,
// 실제 채팅 구독/전송은 다음 커밋에서 추가합니다.

// ===== 함수형 상태(모듈 스코프 변수) =====
// 이 변수들은 파일이 import 될 때 한 번 만들어지고, 앱 전체에서 공유됩니다.
// 컴포넌트마다 새로 생기는 것이 아니라, 하나를 같이 쓰는 구조(싱글톤)입니다.
/** @type {Client | null} */
let client = null;
/** @type {ConnectionState} */
let state = ConnectionState.DISCONNECTED;
/** @type {number} 지수 백오프 기준 지연(ms) */
const baseDelayMs = 500;
/** @type {number} 최대 지연(ms) */
const maxDelayMs = 10_000;
/** @type {number} 현재 재시도 횟수 */
let retryCount = 0;
/** @type {(s: ConnectionState) => void | null} */
let onStateChange = null;
/** 수동 해제 시 자동 재연결을 막기 위한 스위치 */
let reconnectAllowed = true;

// 내부 헬퍼: 상태를 바꾸고, 구독자(리스너)에게 알려줍니다.
const setState = (next) => {
  state = next;
  if (typeof onStateChange === 'function') {
    try {
      onStateChange(next);
    } catch {
      /* noop */
    }
  }
};

/** 상태 변경 콜백 등록
 * - 연결 상태가 바뀔 때마다 호출될 함수를 등록합니다.
 * - UI에서 연결 상태 배지를 바꾸는 등의 용도로 사용할 수 있어요.
 */
export const setOnStateChange = (listener) => {
  onStateChange = listener;
};

/** 현재 연결 상태 조회 */
export const getState = () => state;

/** 지수 백오프 재연결 스케줄링
 * - 연결이 끊어졌을 때, 일정 시간이 지난 뒤 자동으로 다시 연결을 시도합니다.
 * - 재시도 간격은 0.5초 → 1초 → 2초 → 4초 ... 처럼 점점 늘어납니다(최대 10초).
 */
const scheduleReconnect = () => {
  if (state === ConnectionState.CONNECTING) return;
  if (client && client.active) return;
  if (!reconnectAllowed) return; // 사용자가 명시적으로 끊은 경우 재연결하지 않음
  retryCount += 1;
  const delay = Math.min(baseDelayMs * 2 ** (retryCount - 1), maxDelayMs);
  setTimeout(() => {
    connect();
  }, delay);
};

/** 연결 시작
 * - 브라우저에서 서버로 WebSocket 전화를 겁니다.
 * - 연결이 성공하면 상태가 CONNECTED로 바뀝니다.
 */
export const connect = () => {
  if (client && client.active) return; // 이미 연결 중/연결됨

  // 새 연결부터는 예기치 않은 끊김에 대해 재연결을 허용합니다.
  reconnectAllowed = true;

  const next = new Client({
    // 서버 WebSocket 주소 (예: ws://localhost:9005/ws)
    brokerURL: WS_URL,
    // 개발 중에는 STOMP 프레임 로그를 콘솔로 확인하면 문제 파악에 도움이 됩니다.
    debug: (msg) => {
      if (import.meta.env.DEV) console.info('[STOMP]', msg);
    },
    // 자동 재연결은 우리가 직접 관리하므로 0으로 설정합니다.
    // (오류가 나면 scheduleReconnect()가 다시 연결을 시도합니다)
    reconnectDelay: 0,
    // 하트비트: 주기적으로 "살아있음" 신호를 주고받아 끊김을 빠르게 감지합니다.
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    // 어떤 방식으로 실제 WebSocket 객체를 만들지 정의합니다(브라우저 내장 WebSocket 사용).
    webSocketFactory: () => new WebSocket(WS_URL),
    onConnect: () => {
      // 연결 성공! 재시도 카운터를 초기화하고 상태를 CONNECTED로 바꿉니다.
      retryCount = 0;
      setState(ConnectionState.CONNECTED);
    },
    onDisconnect: () => {
      // 정상 종료 시에도 상태를 DISCONNECTED로 반영합니다.
      setState(ConnectionState.DISCONNECTED);
    },
    onStompError: () => {
      // STOMP 프로토콜 레벨의 오류가 났어요 → 잠시 뒤 재연결 시도
      scheduleReconnect();
    },
    onWebSocketError: () => {
      // 네트워크 문제 등으로 소켓 자체에서 오류 → 재연결 시도
      scheduleReconnect();
    },
    onWebSocketClose: () => {
      // 서버 재시작/네트워크 단절 등으로 소켓이 닫힘 → 재연결 시도
      scheduleReconnect();
    },
  });

  client = next;
  // 이제 연결을 시도 중입니다.
  setState(ConnectionState.CONNECTING);
  // 실제로 전화를 겁니다(소켓 오픈 + STOMP 핸드셰이크 시작)
  next.activate();
};

/** 비동기 안전 종료
 * - 연결이 열려 있으면 닫고, 상태를 DISCONNECTED로 바꿉니다.
 * - 컴포넌트가 언마운트될 때 호출해 리소스를 정리하세요.
 */
export const disconnect = async () => {
  if (!client) return;
  try {
    // 수동 해제 → 자동 재연결 금지
    reconnectAllowed = false;
    const prev = client;
    client = null;
    await prev.deactivate();
  } finally {
    setState(ConnectionState.DISCONNECTED);
  }
};

/**
 * 사용 예시(개념용):
 *
 * import { connect, disconnect } from '@/services/websocketService';
 *
 * connect();
 *
 * // 컴포넌트 언마운트 시
 * await disconnect();
 */
