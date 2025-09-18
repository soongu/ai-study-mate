package com.study.mate.dto.request.ai;

import com.study.mate.entity.AIConversation;
import com.study.mate.entity.StudyRoom;
import com.study.mate.entity.User;

public record SaveConversationRequest(
        String providerId, // 인증 주체 식별자(토큰의 subject)
        Long roomId,
        String type,      // "QA" | "REVIEW"
        String prompt,
        String response,
        Integer tokens,
        String model
) {
    // 정적 팩토리: DTO로부터 엔티티를 생성합니다(연관 엔티티는 파라미터로 전달).
    public static AIConversation of(User user, StudyRoom room, SaveConversationRequest req) {
        return AIConversation.builder()
                .user(user)
                .room(room)
                .type(req.type())
                .prompt(req.prompt())
                .response(req.response())
                .tokens(req.tokens())
                .model(req.model())
                .build();
    }
}


