package com.study.mate.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * 스터디룸 나가기 요청 DTO (Java record).
 */
public record LeaveRoomRequest(
        @NotNull(message = "roomId는 필수입니다.") Long roomId,
        // userId는 토큰(subject)으로 서버에서 주입되므로 클라이언트 필수값이 아닙니다.
        Long userId
) {}


