package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.request.ai.CodeReviewRequest;
import com.study.mate.dto.request.ai.ConceptRequest;
import com.study.mate.dto.request.ai.QuestionRequest;
import com.study.mate.dto.response.ai.ChatResponse;
import com.study.mate.dto.response.ai.CodeReviewResponse;
import com.study.mate.service.ai.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

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

    @PostMapping("/concept")
    public ResponseEntity<ApiResponse<ChatResponse>> concept(@RequestBody ConceptRequest req) {
        ChatResponse res = aiService.explainConcept(req);
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}


