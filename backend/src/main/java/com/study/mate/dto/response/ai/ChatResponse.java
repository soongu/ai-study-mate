package com.study.mate.dto.response.ai;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    name = "ChatResponse",
    description = "AI 질문 답변 응답 데이터",
    example = """
    {
        "content": "Java에서 Stream API를 사용하여 중복을 제거하는 방법은 여러 가지가 있습니다:\\n\\n1. **distinct() 사용**:\\n```java\\nList<String> uniqueList = list.stream()\\n    .distinct()\\n    .collect(Collectors.toList());\\n```\\n\\n2. **Collectors.toSet() 사용**:\\n```java\\nSet<String> uniqueSet = list.stream()\\n    .collect(Collectors.toSet());\\n```\\n\\n성능상으로는 HashSet을 사용하는 것이 가장 효율적입니다."
    }
    """
)
public record ChatResponse(
        @Schema(
            description = "AI가 생성한 답변 내용",
            example = "Java에서 Stream API를 사용하여 중복을 제거하는 방법은 여러 가지가 있습니다:\\n\\n1. **distinct() 사용**:\\n```java\\nList<String> uniqueList = list.stream()\\n    .distinct()\\n    .collect(Collectors.toList());\\n```\\n\\n2. **Collectors.toSet() 사용**:\\n```java\\nSet<String> uniqueSet = list.stream()\\n    .collect(Collectors.toSet());\\n```\\n\\n성능상으로는 HashSet을 사용하는 것이 가장 효율적입니다.",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String content
) {}


