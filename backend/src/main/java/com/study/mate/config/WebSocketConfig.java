package com.study.mate.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket + STOMP 기본 설정 클래스.
 *
 * 왜 필요한가요? (HTTP vs WebSocket)
 * - HTTP(REST)는 "요청 → 응답" 한 번으로 끝납니다. 서버가 먼저 말을 걸 수 없습니다.
 * - WebSocket은 "전화 연결"처럼 한 번 연결하면 계속 유지됩니다. 서버도 먼저 말할 수 있어요.
 * - STOMP는 "메시지를 어떻게 주고받을지" 정한 간단한 규칙(프로토콜)입니다.
 *
 * 이 파일이 해주는 일:
 * 1) 브라우저가 WebSocket을 시작할 문(주소)을 만듭니다: "/ws"
 * 2) 메시지를 나눠 받을 "주소 체계"를 만듭니다
 *    - 서버로 보내는 주소는 "/app/..." 로 시작합니다 (전송)
 *    - 서버가 여러 사람에게 알릴 때는 "/topic/..." 주소를 씁니다 (같은 방 모두에게 알림)
 *    - 특정 사람에게만 알릴 때는 "/user/..." + "/queue/..." 조합을 씁니다 (개인 알림)
 * 3) 어떤 PC/브라우저는 WebSocket이 막혀 있을 수 있어서, 자동으로 다른 방식(SockJS)으로도 통신하게 합니다.
 *
 * 낯선 단어, 쉽게 이해하기:
 * - 구독(subscribe): "이 주소의 알림을 받겠습니다"라고 신청하는 것 (예: 뉴스레터 구독)
 * - 전송(send): "이 주소로 메시지를 보냅니다"라고 보내는 것 (예: 사연 보내기)
 * - 토픽(topic): "채팅방 주소" 같은 것 (같은 방을 구독한 모두가 같은 소식을 받음)
 * - 브로드캐스트(broadcast): "같은 방 모두에게 뿌리기"
 * - 메시지 브로커(broker): "알림 배달부". 누가 어떤 주소를 구독했는지 보고, 알맞게 전달합니다.
 *
 * 한 눈에 보는 흐름 예시(채팅방 1):
 * - 브라우저: "/ws"로 서버와 연결을 맺음(전화 연결)
 * - 브라우저: "/topic/rooms/1"을 구독(방 1 소식 받기 신청)
 * - 브라우저: "/app/rooms/1/chat"으로 메시지 전송(내 말 보내기)
 * - 서버: 받은 메시지를 "/topic/rooms/1" 주소로 브로드캐스트(방 1 모두에게 전달)
 */
@Configuration
@EnableWebSocketMessageBroker // STOMP 메시징을 사용하는 WebSocket 서버로 동작하도록 활성화
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final CookieAuthHandshakeInterceptor cookieAuthHandshakeInterceptor;

    /**
     * 브라우저가 WebSocket 연결을 "시작"할 문(주소)을 등록합니다.
     *
     * - "/ws": 브라우저가 가장 처음 접속하는 주소(핸드셰이크 URL)입니다.
     * - setAllowedOriginPatterns: 개발 중에는 로컬 프론트(3000 포트)에서의 연결을 허용합니다.
     *   (운영 환경에서는 실제 도메인만 허용하도록 꼭 바꾸세요)
     */
    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry
            .addEndpoint("/ws")
            .setAllowedOriginPatterns("http://localhost:3000", "http://127.0.0.1:3000")
            .addInterceptors(cookieAuthHandshakeInterceptor);
    }

    /**
     * "주소 체계"와 "알림 배달부(브로커)"를 설정합니다.
     *
     * - registry.enableSimpleBroker("/topic", "/queue")
     *   = 간단한 내부 배달부를 켭니다. 그리고 배달부가 관리하는 주소의 시작을 정합니다.
     *   - "/topic" → 여러 사람이 같은 방 소식을 같이 받는 주소(채팅방 방송)
     *   - "/queue" → 개인 우편함 같은 주소(1명에게만 보내는 알림)
     *
     * - registry.setApplicationDestinationPrefixes("/app")
     *   = "서버에게 보내는 길"의 시작을 정합니다.
     *     브라우저가 "/app/rooms/1/chat"으로 보내면, 서버의 @MessageMapping("/rooms/1/chat") 메서드가 받습니다.
     *
     * - registry.setUserDestinationPrefix("/user")
     *   = "특정 사용자에게 돌려보낼 길"의 시작을 정합니다.
     *     서버는 convertAndSendToUser(사용자ID, "/queue/notice", 메시지) 식으로 한 사람에게만 보낼 수 있습니다.
     *
     * 아주 짧은 예시(개념용):
     * - 구독: client.subscribe('/topic/rooms/1', handler)
     * - 전송: client.send('/app/rooms/1/chat', {}, JSON.stringify({text: '안녕하세요'}))
     * - 수신: 위 구독으로 같은 방의 모든 사람이 메시지를 받음
     */
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
