package com.study.mate.dto.request.ai;

public record CodeReviewRequest(
        String language,
        String code,
        String context
) {}


