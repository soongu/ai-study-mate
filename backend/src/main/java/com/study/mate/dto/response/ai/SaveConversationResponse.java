package com.study.mate.dto.response.ai;

import com.study.mate.entity.AIConversation;
import java.time.LocalDateTime;

public record SaveConversationResponse(
        Long id,
        Long userId,
        Long roomId,
        String type,
        String prompt,
        String response,
        Integer tokens,
        String model,
        LocalDateTime createdAt
) {
    // 정적 팩토리: 엔티티에서 응답 DTO로 변환합니다.
    public static SaveConversationResponse from(AIConversation saved) {
        return new SaveConversationResponse(
                saved.getId(),
                saved.getUser().getId(),
                saved.getRoom() == null ? null : saved.getRoom().getId(),
                saved.getType(),
                saved.getPrompt(),
                saved.getResponse(),
                saved.getTokens(),
                saved.getModel(),
                saved.getCreatedAt()
        );
    }
}


