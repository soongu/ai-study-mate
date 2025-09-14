package com.study.mate.controller;

import com.study.mate.dto.request.ChatSendRequest;
import com.study.mate.service.chat.ChatSocketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import java.security.Principal;

/**
 * WebSocket(STOMP) 채팅 컨트롤러 (MVP)
 *
 * 설명:
 * - 브라우저가 "/app/rooms/{roomId}/chat" 로 보낸 메시지를 받습니다(@MessageMapping).
 * - DB에 저장한 뒤, 같은 방을 구독한 모두에게 "/topic/rooms/{roomId}" 로 브로드캐스트합니다.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatSocketService chatSocketService;

    @MessageMapping("/rooms/{roomId}/chat")
    public void handleChat(
        @DestinationVariable Long roomId,
        @Payload ChatSendRequest request,
        Principal principal
    ) {
        final String providerId = (principal != null ? principal.getName() : null);
        log.info("채팅 메시지 수신: providerId={}, roomId={}, content={}", providerId, roomId, request != null ? request.content() : "null");
       
        /**
         * 1) 요청 바디 검증
         * - 빈 문자열은 저장/방송하지 않습니다.
         */
        if (request == null || request.content() == null || request.content().isBlank()) {
            return;
        }

        /**
         * 2) 누가 보냈는지 식별하기 (인증 정보 가져오기)
         * - STOMP 핸들러에서는 java.security.Principal 를 파라미터로 받을 수 있습니다.
         * - 핸드셰이크에서 설정된 Authentication의 principal 값은 principal.getName()으로 읽습니다.
         *   (우리는 JWT subject=providerId를 넣어두었기 때문에 providerId가 됩니다)
         */

        // 3) 서비스에 위임: 저장 + 브로드캐스트
        chatSocketService.saveAndBroadcast(roomId, request, providerId);
    }
}


