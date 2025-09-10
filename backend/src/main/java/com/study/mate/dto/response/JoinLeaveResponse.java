package com.study.mate.dto.response;

import lombok.Builder;

/**
 * 참여/나가기 결과 응답 DTO (Java record).
 */
@Builder
public record JoinLeaveResponse(Long roomId, Long userId, String action, Long participantCount) {

    /**
     * 참여/나가기 결과 응답을 생성하는 정적 팩토리 메서드.
     */
    public static JoinLeaveResponse of(Long roomId, Long userId, String action, Long participantCount) {
        return JoinLeaveResponse.builder()
                .roomId(roomId)
                .userId(userId)
                .action(action)
                .participantCount(participantCount)
                .build();
    }
}


