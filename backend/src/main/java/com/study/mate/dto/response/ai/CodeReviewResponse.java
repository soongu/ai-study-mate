package com.study.mate.dto.response.ai;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
    name = "CodeReviewResponse",
    description = "AI 코드 리뷰 응답 데이터",
    example = """
    {
        "summary": "전반적으로 잘 작성된 코드입니다. 몇 가지 개선점이 있습니다.",
        "scores": {
            "security": 85,
            "performance": 90,
            "readability": 95
        },
        "issues": [
            "null 체크 누락",
            "에러 처리 부재"
        ],
        "suggestions": [
            "매개변수 유효성 검사 추가",
            "try-catch 블록으로 예외 처리"
        ],
        "quickWins": [
            "JSDoc 주석 추가",
            "변수명 개선"
        ],
        "breakingChanges": [
            "API 시그니처 변경 시 기존 호출자 영향"
        ],
        "issueDetails": [
            {
                "title": "Null 체크 누락",
                "description": "매개변수가 null일 경우 런타임 에러가 발생할 수 있습니다.",
                "severity": "MEDIUM",
                "lineHints": ["line 1"]
            }
        ]
    }
    """
)
public record CodeReviewResponse(
        @Schema(
            description = "코드 리뷰 전반 요약",
            example = "전반적으로 잘 작성된 코드입니다. 몇 가지 개선점이 있습니다.",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String summary,
        
        @Schema(
            description = "보안, 성능, 가독성 점수 (0-100)",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        Scores scores,
        
        @Schema(
            description = "발견된 문제 항목들",
            example = "[\"null 체크 누락\", \"에러 처리 부재\"]",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String[] issues,
        
        @Schema(
            description = "개선 제안사항들",
            example = "[\"매개변수 유효성 검사 추가\", \"try-catch 블록으로 예외 처리\"]",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String[] suggestions,
        
        @Schema(
            description = "빠르게 적용 가능한 개선 아이디어들",
            example = "[\"JSDoc 주석 추가\", \"변수명 개선\"]",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String[] quickWins,
        
        @Schema(
            description = "파급이 큰 변경사항 경고들",
            example = "[\"API 시그니처 변경 시 기존 호출자 영향\"]",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        String[] breakingChanges,
        
        @Schema(
            description = "각 이슈의 상세 정보들",
            requiredMode = Schema.RequiredMode.REQUIRED
        )
        IssueDetail[] issueDetails
) {
    @Schema(
        name = "Scores",
        description = "코드 품질 점수 (0-100)",
        example = """
        {
            "security": 85,
            "performance": 90,
            "readability": 95
        }
        """
    )
    public record Scores(
            @Schema(
                description = "보안 점수 (0-100)",
                example = "85",
                minimum = "0",
                maximum = "100",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            Integer security,
            
            @Schema(
                description = "성능 점수 (0-100)",
                example = "90",
                minimum = "0",
                maximum = "100",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            Integer performance,
            
            @Schema(
                description = "가독성 점수 (0-100)",
                example = "95",
                minimum = "0",
                maximum = "100",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            Integer readability
    ) {}
    
    @Schema(
        name = "IssueDetail",
        description = "이슈 상세 정보",
        example = """
        {
            "title": "Null 체크 누락",
            "description": "매개변수가 null일 경우 런타임 에러가 발생할 수 있습니다.",
            "severity": "MEDIUM",
            "lineHints": ["line 1", "line 3"]
        }
        """
    )
    public record IssueDetail(
            @Schema(
                description = "이슈 제목",
                example = "Null 체크 누락",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            String title,
            
            @Schema(
                description = "이슈 상세 설명",
                example = "매개변수가 null일 경우 런타임 에러가 발생할 수 있습니다.",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            String description,
            
            @Schema(
                description = "이슈 심각도",
                example = "MEDIUM",
                allowableValues = {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            String severity,
            
            @Schema(
                description = "관련 라인 힌트들",
                example = "[\"line 1\", \"line 3\"]",
                requiredMode = Schema.RequiredMode.REQUIRED
            )
            String[] lineHints
    ) {}
}


