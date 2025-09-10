package com.study.mate.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * 스터디룸 나가기 요청 DTO (Java record).
 */
public record LeaveRoomRequest(
        @NotNull(message = "roomId는 필수입니다.") Long roomId,
        @NotNull(message = "userId는 필수입니다.") Long userId
) {}


