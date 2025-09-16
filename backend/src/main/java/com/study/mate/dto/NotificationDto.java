package com.study.mate.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * SSE 알림 메시지 DTO
 * 
 * 설명:
 * - SSE(Server-Sent Events)를 통해 클라이언트에게 전송되는 알림 메시지의 구조를 정의합니다.
 * - 채팅 메시지, 참여자 입장/퇴장, 상태 변경 등 다양한 이벤트 타입을 지원합니다.
 * - 클라이언트는 type 필드를 보고 어떤 종류의 알림인지 판단할 수 있습니다.
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record NotificationDto(
    /**
     * 알림 타입 (예: CHAT_MESSAGE, USER_JOIN, USER_LEAVE, PRESENCE_UPDATE 등)
     */
    String type,
    
    /**
     * 알림이 발생한 스터디룸 ID
     */
    Long roomId,
    
    /**
     * 알림을 발생시킨 사용자의 providerId
     */
    String providerId,
    
    /**
     * 알림을 발생시킨 사용자의 닉네임
     */
    String nickname,
    
    /**
     * 알림 메시지 내용
     */
    String message,
    
    /**
     * 알림 발생 시각
     */
    LocalDateTime timestamp,
    
    /**
     * 추가 데이터 (타입별로 필요한 정보를 담는 확장 가능한 필드)
     * 예: 채팅 메시지의 경우 메시지 ID, 상태 변경의 경우 새로운 상태 등
     */
    Map<String, Object> data
) {
    
    /**
     * 채팅 메시지 알림 생성
     */
    public static NotificationDto chatMessage(Long roomId, String providerId, String nickname, String messageContent) {
        return NotificationDto.builder()
            .type("CHAT_MESSAGE")
            .roomId(roomId)
            .providerId(providerId)
            .nickname(nickname)
            .message(messageContent)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 사용자 입장 알림 생성
     */
    public static NotificationDto userJoin(Long roomId, String providerId, String nickname) {
        return NotificationDto.builder()
            .type("USER_JOIN")
            .roomId(roomId)
            .providerId(providerId)
            .nickname(nickname)
            .message(nickname + "님이 스터디룸에 참여했습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 사용자 퇴장 알림 생성
     */
    public static NotificationDto userLeave(Long roomId, String providerId, String nickname) {
        return NotificationDto.builder()
            .type("USER_LEAVE")
            .roomId(roomId)
            .providerId(providerId)
            .nickname(nickname)
            .message(nickname + "님이 스터디룸을 나갔습니다.")
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 사용자 상태 변경 알림 생성
     */
    public static NotificationDto presenceUpdate(Long roomId, String providerId, String nickname, String status) {
        String statusMessage = switch (status) {
            case "STUDYING" -> nickname + "님이 학습 중입니다.";
            case "BREAK" -> nickname + "님이 휴식 중입니다.";
            case "ONLINE" -> nickname + "님이 온라인 상태입니다.";
            case "OFFLINE" -> nickname + "님이 오프라인 상태입니다.";
            default -> nickname + "님의 상태가 " + status + "(으)로 변경되었습니다.";
        };
        
        return NotificationDto.builder()
            .type("PRESENCE_UPDATE")
            .roomId(roomId)
            .providerId(providerId)
            .nickname(nickname)
            .message(statusMessage)
            .timestamp(LocalDateTime.now())
            .data(Map.of("status", status))
            .build();
    }
}
