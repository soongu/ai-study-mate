package com.study.mate.dto.request.ai;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    name = "CodeReviewRequest",
    description = "AI 코드 리뷰 요청 데이터",
    example = """
    {
        "language": "javascript",
        "code": "function add(a, b) { return a + b; }",
        "context": "간단한 덧셈 함수입니다. 에러 처리가 필요할까요?"
    }
    """
)
public record CodeReviewRequest(
        @Schema(
            description = "프로그래밍 언어",
            example = "javascript",
            allowableValues = {"javascript", "java", "python", "typescript", "cpp", "csharp", "go", "rust", "php", "ruby", "swift", "kotlin"},
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String language,
        
        @Schema(
            description = "리뷰할 코드",
            example = "function add(a, b) { return a + b; }",
            minLength = 1,
            maxLength = 10000,
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String code,
        
        @Schema(
            description = "코드에 대한 추가 컨텍스트나 설명",
            example = "간단한 덧셈 함수입니다. 에러 처리가 필요할까요?",
            maxLength = 1000,
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        String context
) {}


