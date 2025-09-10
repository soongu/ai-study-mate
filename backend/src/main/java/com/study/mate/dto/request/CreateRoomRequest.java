package com.study.mate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 스터디룸 생성 요청 DTO (Java record).
 *
 * userId는 토큰(subject)으로부터 서버에서 결정합니다.
 */
public record CreateRoomRequest(
        @NotBlank(message = "title은 필수입니다.") 
        @Size(max = 100, message = "title은 최대 100자입니다.") 
        String title,
        @Size(max = 1000, message = "description은 최대 1000자입니다.") 
        String description
) {}


