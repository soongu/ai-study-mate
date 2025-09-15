package com.study.mate.controller;

import com.study.mate.entity.ParticipantStatus;
import com.study.mate.service.presence.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    /**
     * Presence 상태 변경 요청 바디 (아주 작은 DTO)
     * - status: "ONLINE" | "STUDYING" | "BREAK" | "OFFLINE"
     */
    public record PresenceUpdateRequest(String status) {}

    /**
     * 사용자가 자신의 상태(ONLINE/STUDYING/BREAK)를 변경할 때 호출되는 STOMP 핸들러.
     *
     * 핵심 개념
     * - @MessageMapping("/rooms/{roomId}/presence/update") 는
     *   프론트에서 client.send("/app/rooms/{roomId}/presence/update", body) 로 보낸 메시지를 처리합니다.
     *   여기서 "/app" 은 서버로 보내는 주소의 접두사(전송 prefix)입니다.
     * - @DestinationVariable Long roomId: 경로의 {roomId} 값을 숫자로 받습니다.
     * - @Payload PresenceUpdateRequest req: STOMP 메시지 본문(JSON)을 자바 객체로 변환해줍니다.
     * - Principal principal: 현재 웹소켓 세션의 인증 사용자(쿠키 기반 인증에서 꺼냄)입니다.
     *
     * 프론트엔드 예시 (React, websocketService.js 가정)
     *
     * // 상태를 "STUDYING" 으로 변경
     * wsSend(`/app/rooms/${roomId}/presence/update`, { status: 'STUDYING' });
     *
     * // 상태를 "BREAK" 로 변경
     * wsSend(`/app/rooms/${roomId}/presence/update`, { status: 'BREAK' });
     */
    @MessageMapping("/rooms/{roomId}/presence/update")
    public void update(@DestinationVariable Long roomId, @Payload PresenceUpdateRequest req, Principal principal) {
        // 안전장치: 인증/바디 누락 시 무시
        if (principal == null || req == null || req.status() == null) return;
        String providerId = principal.getName();
        ParticipantStatus status;
        try {
            status = ParticipantStatus.valueOf(req.status());
        } catch (IllegalArgumentException ex) {
            // 허용되지 않은 값이면 무시 (예: 오타)
            return;
        }
        // 서비스에 위임: 상태 저장 + 해당 방으로 브로드캐스트
        presenceService.updateStatus(roomId, providerId, status);
    }

    /**
     * 하트비트(heartbeat) 수신용 STOMP 핸들러.
     * - 클라이언트가 주기적으로 호출해 "아직 접속 중"임을 알려줄 때 사용합니다.
     *
     * 프론트엔드 예시 (10~20초 간격 타이머로 전송 권장)
     *
     * wsSend(`/app/rooms/${roomId}/presence/heartbeat`, {});
     */
    @MessageMapping("/rooms/{roomId}/presence/heartbeat")
    public void heartbeat(@DestinationVariable Long roomId, Principal principal) {
        // 인증 누락 시 무시
        if (principal == null) return;
        presenceService.heartbeat(roomId, principal.getName());
    }
}


