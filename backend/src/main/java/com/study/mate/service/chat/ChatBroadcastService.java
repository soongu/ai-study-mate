package com.study.mate.service.chat;

import com.study.mate.dto.response.ChatMessageResponse;
import com.study.mate.entity.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * 채팅 메시지 브로드캐스트 전용 서비스
 *
 * 역할
 * - 저장된 메시지를 구독자들에게 STOMP로 배달하는 역할만 수행합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastToRoom(Long roomId, ChatMessage message) {
        ChatMessageResponse payload = ChatMessageResponse.from(message);
        String destination = "/topic/rooms/" + roomId;
        // 간단한 재시도: 일시적인 오류에 대비해 최대 3회 시도
        int attempts = 0;
        RuntimeException lastError = null;
        while (attempts < 3) {
            try {
                messagingTemplate.convertAndSend(destination, payload);
                log.debug("브로드캐스트 완료: roomId={}, msgId={} -> {}", roomId, message.getId(), destination);
                return;
            } catch (RuntimeException ex) {
                lastError = ex;
                attempts++;
                try { Thread.sleep(50L * attempts); } catch (InterruptedException ignored) {}
            }
        }
        if (lastError != null) throw lastError;
    }
}


