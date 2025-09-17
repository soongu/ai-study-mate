package com.study.mate.dto.response.ai;

//  코드 리뷰 응답 스키마
// - summary: 전반 요약
// - scores: 보안/성능/가독성 점수(0~100 권장)
// - issues: 발견된 문제 항목(간단 문자열 리스트)
// - suggestions: 개선 제안(간단 문자열 리스트)
// - quickWins: 빠르게 적용 가능한 개선 아이디어
// - breakingChanges: 파급이 큰 변경사항 경고
// - issueDetails: 각 이슈의 상세(제목/설명/심각도/라인 힌트)
public record CodeReviewResponse(
        String summary,
        Scores scores,
        String[] issues,
        String[] suggestions,
        String[] quickWins,
        String[] breakingChanges,
        IssueDetail[] issueDetails
) {
    public record Scores(Integer security, Integer performance, Integer readability) {}
    public record IssueDetail(
            String title,
            String description,
            String severity,
            String[] lineHints
    ) {}
}


