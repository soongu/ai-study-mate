package com.study.mate.dto.request.ai;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    name = "QuestionRequest",
    description = "AI 질문 답변 요청 데이터",
    example = """
    {
        "question": "Java에서 Stream API를 사용해서 리스트의 중복을 제거하는 방법을 알려주세요.",
        "context": "Java 8 이상에서 사용 가능한 방법을 원합니다. 성능도 고려해주세요."
    }
    """
)
public record QuestionRequest(
        @Schema(
            description = "AI에게 질문할 내용",
            example = "Java에서 Stream API를 사용해서 리스트의 중복을 제거하는 방법을 알려주세요.",
            minLength = 1,
            maxLength = 2000,
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String question,
        
        @Schema(
            description = "질문에 대한 추가 컨텍스트나 배경 정보",
            example = "Java 8 이상에서 사용 가능한 방법을 원합니다. 성능도 고려해주세요.",
            maxLength = 1000,
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        String context
) {}


