package com.study.mate.dto.response.ai;

public record CodeReviewResponse(
        String summary,
        String[] issues,
        String[] suggestions
) {}


