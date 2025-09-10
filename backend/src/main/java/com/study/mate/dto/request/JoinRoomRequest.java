package com.study.mate.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * 스터디룸 참여 요청 DTO (Java record).
 */
public record JoinRoomRequest(
        @NotNull(message = "roomId는 필수입니다.") Long roomId,
        @NotNull(message = "userId는 필수입니다.") Long userId
) {}


