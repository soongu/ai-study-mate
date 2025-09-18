package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.request.ai.CodeReviewRequest;
import com.study.mate.dto.request.ai.ConceptRequest;
import com.study.mate.dto.request.ai.QuestionRequest;
import com.study.mate.dto.response.ai.ChatResponse;
import com.study.mate.dto.response.ai.CodeReviewResponse;
import com.study.mate.entity.AIConversation;
import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;
import com.study.mate.service.ai.AIConversationService;
import com.study.mate.service.ai.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final AIConversationService conversationService;

    @PostMapping("/code-review")
    public ResponseEntity<ApiResponse<CodeReviewResponse>> review(@RequestBody CodeReviewRequest req) {
        CodeReviewResponse res = aiService.reviewCode(req);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/question")
    public ResponseEntity<ApiResponse<ChatResponse>> question(@RequestBody QuestionRequest req) {
        ChatResponse res = aiService.answerQuestion(req);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }


    // 최근 AI 대화 10개 조회(인증 사용자 기준)
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AIConversation>>> history(
            @RequestParam(name = "limit", required = false) Integer limit,
            @AuthenticationPrincipal String providerId
        ) {
        int lim = (limit == null || limit <= 0) ? 10 : limit;
        List<AIConversation> list = conversationService.findRecentByUser(providerId, lim);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

}


