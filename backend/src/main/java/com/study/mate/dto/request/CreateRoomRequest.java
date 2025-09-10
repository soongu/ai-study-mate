package com.study.mate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 스터디룸 생성 요청 DTO (Java record).
 */
public record CreateRoomRequest(
        @NotNull(message = "hostUserId는 필수입니다.") 
        Long hostUserId,
        @NotBlank(message = "title은 필수입니다.") 
        @Size(max = 100, message = "title은 최대 100자입니다.") 
        String title,
        @Size(max = 1000, message = "description은 최대 1000자입니다.") 
        String description
) {}


