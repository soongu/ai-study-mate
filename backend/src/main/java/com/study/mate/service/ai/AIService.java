package com.study.mate.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import com.study.mate.dto.request.ai.CodeReviewRequest;
import com.study.mate.dto.response.ai.CodeReviewResponse;
import com.study.mate.dto.request.ai.QuestionRequest;
import com.study.mate.dto.request.ai.ConceptRequest;
import com.study.mate.dto.response.ai.ChatResponse;
import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;

// AIService 는 Spring AI 의 ChatClient 를 사용해
// LLM(여기서는 Gemini, OpenAI 호환 엔드포인트)을 호출하는 서비스입니다.
// 초보자 가이드:
// - ChatClient: "시스템 메시지"와 "사용자 메시지"를 조합하여 모델에 보냅니다.
// - 시스템 메시지: 모델의 역할/규칙을 설명합니다.
// - 사용자 메시지: 실제 사용자 입력(여기서는 코드/컨텍스트)을 전달합니다.
@Service
@RequiredArgsConstructor
public class AIService {

    // Spring 이 자동 주입하는 ChatClient 입니다.
    private final ChatClient chatClient;

    // JSON 블록 추출(코드펜스/문장 섞인 응답에서도 JSON만 뽑아내기 위함)
    private static final Pattern JSON_BLOCK = Pattern.compile("\\{.*?\\}", Pattern.DOTALL);

    // "코드 리뷰 프롬프트"를 동적으로 생성합니다.
    // - 한국어 출력 고정
    // - JSON 스키마 강제(마크다운/코드펜스 금지)
    // - 언어별 체크 포인트 포함
    // - 보안/성능/품질을 균형 있게 평가
    private String buildSystemPrompt(final String language) {
        // 언어별 추가 가이드(간단 매핑)
        final String extraGuide;
        switch (language == null ? "" : language.toLowerCase()) {
            case "java" -> extraGuide = "자바 관례(명명, 예외 처리, 스트림/컬렉션, NPE/동시성) 점검";
            case "javascript", "typescript" -> extraGuide = "XSS/CSRF, 비동기 오류 처리, 불변성, DOM 안전, 번들 크기";
            case "python" -> extraGuide = "PEP8, 타입힌트, 예외 처리, 가상환경/의존성, GIL 고려";
            case "sql" -> extraGuide = "인덱싱, N+1, 트랜잭션 격리, 주입 방지, 실행 계획";
            default -> extraGuide = "언어 특성에 맞는 관례와 보안/성능/품질 전반 점검";
        }

        // JSON 스키마와 출력 규칙을 매우 구체적으로 지시합니다.
        return (
            "너는 한국어로 답변하는 시니어 보안/성능 코드 리뷰어야. 대상 언어: " + (language == null ? "unknown" : language) + "\n" +
            "오직 하나의 JSON 객체만 출력해. 마크다운/코드펜스/설명 문장/주석은 절대 금지.\n" +
            "스키마 및 제약:\n" +
            "{\n" +
            "  \"summary\": string,                       // 1~300자, 한국어, 핵심 요약\n" +
            "  \"scores\": {                             // 각 0~100 정수, 없으면 null\n" +
            "    \"security\": number|null,\n" +
            "    \"performance\": number|null,\n" +
            "    \"readability\": number|null\n" +
            "  },\n" +
            "  \"issues\": [                             // 최대 10개\n" +
            "    { \"title\": string,                    // 1~120자\n" +
            "      \"severity\": \"low|medium|high|critical\",\n" +
            "      \"description\": string,              // 1~300자, 구체적 근거 포함\n" +
            "      \"lineHints\": [string]               // 예: '라인 42', 모르면 비우기\n" +
            "    }\n" +
            "  ] ,\n" +
            "  \"suggestions\": [                        // 최대 10개, 실행 가능한 개선안\n" +
            "    { \"title\": string, \"description\": string }\n" +
            "  ],\n" +
            "  \"quickWins\": [ string ],                // 1~5개, 즉시 반영 가능한 팁\n" +
            "  \"breakingChanges\": [ string ]           // 파급이 큰 변경 경고(없으면 빈 배열)\n" +
            "}\n\n" +
            "출력 규칙:\n" +
            "- 한국어만 사용, 키 이름은 정확히 유지(summary/scores/issues/suggestions/quickWins/breakingChanges).\n" +
            "- 불확실하면 해당 필드는 null 또는 빈 배열로. 임의의 키 추가 금지.\n" +
            "- 문자열은 불필요한 수식어를 제거하고 간결하게. 줄바꿈/백틱/마크다운 금지.\n" +
            "- 보안/성능/품질을 균형 있게 평가. 추가 가이드: " + extraGuide + "\n" +
            "- 코드 원문을 길게 복사하지 말고, 필요 시 핵심 라인만 lineHints로 제시.\n"
        );
    }

    // 코드 리뷰 수행 메서드입니다.
    // 1) (선택) 컨텍스트와 코드 본문을 합쳐 사용자 메시지를 구성합니다.
    // 2) 상용 수준의 시스템 프롬프트로 LLM 호출(JSON 스키마 강제).
    // 3) JSON 파싱을 시도하고, 실패 시 텍스트 전체를 요약으로 폴백합니다.
    public CodeReviewResponse reviewCode(final CodeReviewRequest req) {
        try {
            // 0) 입력값 검증: 코드가 비어 있으면 즉시 실패
            if (req == null || req.code() == null || req.code().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "코드가 비어 있습니다.");
            }
            String language = (req.language() == null || req.language().isBlank()) ? "unknown" : req.language();

            // 1) 사용자 메시지 구성: 사전 점검 + (선택)컨텍스트 + 코드
            StringBuilder userContent = new StringBuilder();
            String pre = buildPreAnalysis(language, req.code());
            if (!pre.isBlank()) {
                userContent.append("[사전 점검]\n").append(pre).append("\n\n");
            }
            if (Objects.nonNull(req.context()) && !req.context().isBlank()) {
                userContent.append("[컨텍스트]\n").append(req.context()).append("\n\n");
            }
            userContent.append("[코드]\n").append(req.code());

            // 2) 모델 호출 (언어별 가이드 + JSON 스키마 강제 프롬프트 사용)
            String response = chatClient
                    .prompt()
                    .system(s -> s.text(buildSystemPrompt(language)))
                    .user(u -> u.text(userContent.toString()))
                    .call()
                    .content();

            // 3) JSON 파싱 시도 → 실패 시 원문을 요약으로 반환
            CodeReviewResponse parsed = parseReviewJson(response);
            if (parsed != null) return parsed;
            return new CodeReviewResponse(
                    response,
                    new CodeReviewResponse.Scores(null, null, null),
                    new String[0], new String[0], new String[0], new String[0]
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 코드 리뷰 중 오류가 발생했습니다.");
        }
    }

    // 간단한 휴리스틱 사전 점검으로 모델에 힌트를 제공합니다.
    private String buildPreAnalysis(String language, String code) {
        String lower = code.toLowerCase();
        StringBuilder sb = new StringBuilder();
        if (lower.contains("runtime.getruntime().exec") || lower.contains("processbuilder(")) {
            sb.append("[위험] OS 명령 실행 사용 흔적");
        }
        if (lower.contains("eval(") || lower.contains("new function(")) {
            if (!sb.isEmpty()) sb.append("; ");
            sb.append("[주의] eval 류 동적 실행 사용 가능성");
        }
        if (lower.contains("select ") && lower.contains(" + ")) {
            if (!sb.isEmpty()) sb.append("; ");
            sb.append("[주의] 문자열 결합 기반 SQL 구성 (인젝션 위험)");
        }
        return sb.toString();
    }

    // 모델 응답 문자열에서 summary/issues/suggestions 을 추출합니다.
    // - 응답이 확장 스키마(객체 배열)여도 문자열 배열로 유연하게 변환합니다.
    private CodeReviewResponse parseReviewJson(String raw) {
        try {
            String json = extractJson(raw);
            if (json == null) return null;
            ObjectMapper om = new ObjectMapper();
            JsonNode node = om.readTree(json);
            String summary = node.path("summary").asText("");
            CodeReviewResponse.Scores scores = new CodeReviewResponse.Scores(
                    node.path("scores").path("security").isNumber() ? node.path("scores").path("security").asInt() : null,
                    node.path("scores").path("performance").isNumber() ? node.path("scores").path("performance").asInt() : null,
                    node.path("scores").path("readability").isNumber() ? node.path("scores").path("readability").asInt() : null
            );
            String[] issues = toStringArray(om, node.path("issues"));
            String[] suggestions = toStringArray(om, node.path("suggestions"));
            String[] quickWins = toStringArray(om, node.path("quickWins"));
            String[] breaking = toStringArray(om, node.path("breakingChanges"));
            return new CodeReviewResponse(summary, scores, issues, suggestions, quickWins, breaking);
        } catch (Exception ignore) {
            return null;
        }
    }

    // 배열 노드가 문자열들이거나, 객체들의 배열인 경우를 모두 수용합니다.
    // - 문자열 배열: 그대로 반환
    // - 객체 배열: title/description 을 적절히 합쳐 한 줄 설명으로 변환
    private String[] toStringArray(ObjectMapper om, JsonNode node) {
        if (!node.isArray()) return new String[0];
        // 문자열 배열로 직변환 시도
        try {
            return om.convertValue(node, om.getTypeFactory().constructArrayType(String.class));
        } catch (IllegalArgumentException ignore) {
            // 객체 배열 → 사람이 읽기 쉬운 한 줄 문자열로 변환
            String[] arr = new String[node.size()];
            for (int i = 0; i < node.size(); i++) {
                JsonNode it = node.get(i);
                String title = it.path("title").asText("");
                String desc = it.path("description").asText("");
                String sev = it.path("severity").asText("");
                String lineHint = it.path("lineHints").isArray() && it.path("lineHints").size() > 0
                        ? it.path("lineHints").get(0).asText("") : "";
                String combined = (sev.isBlank() ? "" : ("[" + sev + "] ")) +
                        (title.isBlank() ? desc : title) +
                        (lineHint.isBlank() ? "" : (" (" + lineHint + ")"));
                arr[i] = combined.isBlank() ? it.toString() : combined;
            }
            return arr;
        }
    }

    private String extractJson(String raw) {
        if (raw == null) return null;
        Matcher m = JSON_BLOCK.matcher(raw);
        if (m.find()) return m.group().trim();
        String t = raw.trim();
        if (t.startsWith("{") && t.endsWith("}")) return t;
        return null;
    }

    // 간단 Q&A (한글 시스템 프롬프트 간소화)
    public ChatResponse answerQuestion(final QuestionRequest req) {
        try {
            String response = chatClient
                    .prompt()
                    .system(s -> s.text("""
                      너는 한국어로 대답하는 친절한 선생님이야.
                        
                        """))
                    .user(u -> u.text(req.question()))
                    .call()
                    .content();
            return new ChatResponse(response);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 질문 처리 중 오류가 발생했습니다.");
        }
    }

    // 개념 설명
    public ChatResponse explainConcept(final ConceptRequest req) {
        try {
            String response = chatClient
                    .prompt()
                    .system(s -> s.text("너는 초보자에게 쉽게 설명하는 한국어 튜터야."))
                    .user(u -> u.text("개념: " + req.concept() + "\n수준: " + (req.level() == null ? "beginner" : req.level())))
                    .call()
                    .content();
            return new ChatResponse(response);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 개념 설명 중 오류가 발생했습니다.");
        }
    }
}


