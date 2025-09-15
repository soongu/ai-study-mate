package com.study.mate.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import com.study.mate.service.UsersService;
import com.study.mate.service.chat.UserSessionRegistry;

/**
 * WebSocket 이벤트 리스너
 *
 * 설명:
 * - 이 리스너는 "구독(Subscribe)"과 "구독 해제(Unsubscribe)" 이벤트를 감지해서
 *   채팅방 토픽으로 입장/퇴장 시스템 메시지를 보냅니다.
 * - 아직은 "세션 레지스트리"를 쓰지 않기 때문에, 같은 사람이 탭 여러 개로 들어오면
 *   입장 알림이 여러 번 뜹니다(일부러 문제를 보여주는 단계). 이후 레지스트리로 개선합니다.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventsListener {

  // STOMP 구독자에게 메시지를 보내는 스프링 헬퍼(배달부 역할)
  private final SimpMessagingTemplate messagingTemplate;
  // providerId(=JWT subject)로 사용자 정보를 조회해 닉네임을 알림 문구에 사용
  private final UsersService usersService;
  private final UserSessionRegistry registry;

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        // STOMP 프레임의 헤더들에 접근하기 위한 어댑터
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        // 클라이언트가 구독한 목적지(예: "/topic/rooms/1")
        String destination = accessor.getDestination();
        // 구독 주소에서 방 아이디를 안전하게 추출(예: rooms/1 → 1)
        Long roomId = parseRoomId(destination);
        // 핸드셰이크에서 인증된 사용자 식별자(JWT subject=providerId)
        String providerId = accessor.getUser() != null ? accessor.getUser().getName() : "anonymous";
        if (roomId != null) {
            log.info("SUBSCRIBE room={}, providerId={}", roomId, providerId);
            boolean firstJoin = registry.handleSubscribe(accessor.getSessionId(), accessor.getSubscriptionId(), roomId, providerId);
            if (firstJoin) {
                messagingTemplate.convertAndSend("/topic/rooms/" + roomId,
                    new SystemMessagePayload("JOIN", providerId, usersService.findMeByProviderId(providerId).getNickname() + " 님이 입장했습니다."));
            }
        }
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        // 구독 해제 이벤트(대부분 페이지 이동/탭 닫기 전에 발생)
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        var result = registry.handleUnsubscribe(accessor.getSessionId(), accessor.getSubscriptionId());
        if (result != null && result.lastLeave() && result.providerId() != null) {
            messagingTemplate.convertAndSend("/topic/rooms/" + result.roomId(),
                new SystemMessagePayload("LEAVE", result.providerId(), usersService.findMeByProviderId(result.providerId()).getNickname() + " 님이 퇴장했습니다."));
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        // 웹소켓 세션이 끊겼을 때(브라우저 탭 닫기, 네트워크 단절 등)
        String sessionId = event.getSessionId();
        var results = registry.handleDisconnect(sessionId);
        results.stream().filter(r -> r.lastLeave() && r.providerId() != null).forEach(r -> {
            messagingTemplate.convertAndSend("/topic/rooms/" + r.roomId(),
                new SystemMessagePayload("LEAVE", r.providerId(), usersService.findMeByProviderId(r.providerId()).getNickname() + " 님이 퇴장했습니다."));
        });
    }

    private Long parseRoomId(String destination) {
        // 예: "/topic/rooms/1" → 1 을 추출합니다.
        if (destination == null) return null;
        try {
            // 기대 포맷: /topic/rooms/{id}
            String[] parts = destination.split("/");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("rooms".equals(parts[i])) {
                    return Long.parseLong(parts[i + 1]);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * 프론트가 타입에 따라 다르게 렌더링할 수 있도록 간단한 시스템 메시지 구조를 보냅니다.
     * - type: "JOIN" | "LEAVE" 등 이벤트 구분자
     * - providerId: 누가 입/퇴장했는지 식별용(닉네임은 content로 전달)
     * - content: 화면에 바로 보여줄 문구(채팅창 중앙 라벨)
     */
    public record SystemMessagePayload(String type, String providerId, String content) {}
}


