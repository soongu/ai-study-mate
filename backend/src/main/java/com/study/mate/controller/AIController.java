package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.request.ai.CodeReviewRequest;
import com.study.mate.dto.request.ai.QuestionRequest;
import com.study.mate.dto.response.ai.ChatResponse;
import com.study.mate.dto.response.ai.CodeReviewResponse;
import com.study.mate.entity.AIConversation;
import com.study.mate.service.ai.AIConversationService;
import com.study.mate.service.ai.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(
    name = "AI Assistant", 
    description = "AI 학습 도우미 API - 코드 리뷰, 질문 답변, 학습 히스토리 관리"
)
@SecurityRequirement(name = "bearerAuth")
public class AIController {

    private final AIService aiService;
    private final AIConversationService conversationService;

    @Operation(
        summary = "코드 리뷰 요청",
        description = "AI가 제공된 코드를 분석하여 개선점, 버그, 성능 최적화 등을 제안합니다.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "코드 리뷰 요청 정보",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = CodeReviewRequest.class),
                examples = @ExampleObject(
                    name = "JavaScript 코드 리뷰 예시",
                    summary = "JavaScript 함수 리뷰",
                    value = """
                    {
                        "code": "function add(a, b) { return a + b; }",
                        "language": "javascript",
                        "context": "간단한 덧셈 함수입니다."
                    }
                    """
                )
            )
        )
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "코드 리뷰 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "성공 응답",
                    value = """
                    {
                        "success": true,
                        "message": "OK",
                        "data": {
                            "review": "코드가 잘 작성되었습니다. 다만 에러 처리를 추가하는 것을 권장합니다.",
                            "suggestions": ["null 체크 추가", "타입 검증 추가"],
                            "score": 8.5
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 요청 (코드가 비어있거나 언어가 지원되지 않음)",
            content = @Content(mediaType = "application/json")
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "인증되지 않은 사용자",
            content = @Content(mediaType = "application/json")
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "429",
            description = "요청 한도 초과 (Rate Limit)",
            content = @Content(mediaType = "application/json")
        )
    })
    @PostMapping("/code-review")
    public ResponseEntity<ApiResponse<CodeReviewResponse>> review(
        @RequestBody CodeReviewRequest req
    ) {
        CodeReviewResponse res = aiService.reviewCode(req);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @Operation(
        summary = "AI 질문 답변",
        description = "프로그래밍, 알고리즘, 기술 관련 질문에 대해 AI가 상세한 답변을 제공합니다.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "질문 요청 정보",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = QuestionRequest.class),
                examples = @ExampleObject(
                    name = "프로그래밍 질문 예시",
                    summary = "Java 스트림 API 질문",
                    value = """
                    {
                        "question": "Java에서 Stream API를 사용해서 리스트의 중복을 제거하는 방법을 알려주세요.",
                        "context": "Java 8 이상에서 사용 가능한 방법을 원합니다."
                    }
                    """
                )
            )
        )
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "질문 답변 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "성공 응답",
                    value = """
                    {
                        "success": true,
                        "message": "OK",
                        "data": {
                            "answer": "Java Stream API를 사용하여 중복을 제거하는 방법은 다음과 같습니다...",
                            "relatedTopics": ["distinct()", "Collectors.toSet()", "HashSet"]
                        }
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 요청 (질문이 비어있음)",
            content = @Content(mediaType = "application/json")
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "인증되지 않은 사용자",
            content = @Content(mediaType = "application/json")
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "429",
            description = "요청 한도 초과 (Rate Limit)",
            content = @Content(mediaType = "application/json")
        )
    })
    @PostMapping("/question")
    public ResponseEntity<ApiResponse<ChatResponse>> question(
        @RequestBody QuestionRequest req
    ) {
        ChatResponse res = aiService.answerQuestion(req);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }


    @Operation(
        summary = "AI 대화 히스토리 조회",
        description = "현재 사용자의 최근 AI 대화 기록을 조회합니다. 기본적으로 최근 10개의 대화를 반환합니다.",
        parameters = {
            @Parameter(
                name = "limit",
                description = "조회할 대화 개수 (기본값: 10, 최대: 50)",
                example = "10",
                schema = @Schema(type = "integer", minimum = "1", maximum = "50")
            )
        }
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "대화 히스토리 조회 성공",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class),
                examples = @ExampleObject(
                    name = "성공 응답",
                    value = """
                    {
                        "success": true,
                        "message": "OK",
                        "data": [
                            {
                                "id": 1,
                                "type": "CODE_REVIEW",
                                "userInput": "function add(a, b) { return a + b; }",
                                "aiResponse": "코드가 잘 작성되었습니다...",
                                "createdAt": "2024-01-15T10:30:00Z"
                            },
                            {
                                "id": 2,
                                "type": "QUESTION",
                                "userInput": "Java Stream API 사용법을 알려주세요",
                                "aiResponse": "Java Stream API는...",
                                "createdAt": "2024-01-15T09:15:00Z"
                            }
                        ]
                    }
                    """
                )
            )
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401",
            description = "인증되지 않은 사용자",
            content = @Content(mediaType = "application/json")
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 요청 (limit 값이 범위를 벗어남)",
            content = @Content(mediaType = "application/json")
        )
    })
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AIConversation>>> history(
        @Parameter(description = "조회할 대화 개수 (기본값: 10)") 
        @RequestParam(name = "limit", required = false) Integer limit,
        @Parameter(hidden = true) // Swagger UI에서 숨김 (인증 정보)
        @AuthenticationPrincipal String providerId
    ) {
        int lim = (limit == null || limit <= 0) ? 10 : limit;
        List<AIConversation> list = conversationService.findRecentByUser(providerId, lim);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

}


