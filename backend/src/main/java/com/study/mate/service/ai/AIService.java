package com.study.mate.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import java.util.Objects;
import org.springframework.stereotype.Service;

import com.study.mate.dto.request.ai.CodeReviewRequest;
import com.study.mate.dto.response.ai.CodeReviewResponse;
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

    // 시스템 프롬프트(규칙)를 한글로 작성합니다.
    // {language} 는 나중에 실제 값(예: "Java", "JavaScript")으로 치환됩니다.
    private static final String SYSTEM_TEMPLATE = """
            당신은 세심하고 친절한 코드 리뷰어입니다. 다음 조건에 맞춰 {language} 코드를 분석해 주세요.
            출력은 한국어로 작성하고, 아래 항목을 포함해 주세요.

            - 요약(Summary): 핵심 의도와 전반적 품질을 한 문단으로 요약
            - 문제점(Issues): 버그 가능성, 보안 위험, 유지보수성 저해 요소를 목록으로 제시
            - 제안(Suggestions): 개선 아이디어를 목록으로 제시 (가독성/성능/안전성 관점)

            리뷰 시 유의사항:
            - 절대로 코드 원문을 그대로 반복 나열하지 말고, 진짜로 분석/이해한 내용을 적을 것
            - 초보자도 이해할 수 있도록 쉽게 설명할 것
            - 필요한 경우 간단한 코드 예시를 덧붙일 것
            """;

    // 코드 리뷰 수행 메서드입니다.
    // 1) 사용자 컨텍스트(선택 사항)와 코드 본문을 합쳐서 사용자 메시지를 만듭니다.
    // 2) 시스템 프롬프트와 함께 ChatClient 로 모델을 호출합니다.
    // 3) 응답 텍스트를 간단히 요약/이슈/제안에 매핑합니다(지금은 placeholder).
    public CodeReviewResponse reviewCode(final CodeReviewRequest req) {
        try {
            // 사용자 메시지 구성: 컨텍스트가 있으면 먼저 붙이고, 그 다음 코드 원문을 넣습니다.
            StringBuilder userContent = new StringBuilder();
            if (Objects.nonNull(req.context()) && !req.context().isBlank()) {
                userContent.append("[컨텍스트]\n").append(req.context()).append("\n\n");
            }
            userContent.append("[코드]\n").append(req.code());

            // ChatClient 로 프롬프트 전송:
            // - system(): 시스템 프롬프트(규칙)와 치환 파라미터 설정
            // - user(): 사용자 입력(컨텍스트/코드) 전달
            String response = chatClient
                    .prompt()
                    .system(s -> s.text(SYSTEM_TEMPLATE).param("language", req.language()))
                    .user(u -> u.text(userContent.toString()))
                    .call()
                    .content();

            // 응답 파싱(간단 버전):
            // 지금은 전체 응답을 요약으로만 넣고, 이슈/제안은 빈 배열로 둡니다.
            // 추후에 JSON 포맷으로 엄격 파싱하도록 개선할 수 있습니다.
            String summary = response;
            String[] issues = new String[0];
            String[] suggestions = new String[0];
            return new CodeReviewResponse(summary, issues, suggestions);
        } catch (Exception e) {
            // 공통 예외 처리 체계로 위임합니다.
            // GlobalExceptionHandler 가 ErrorCode 에 맞춰 응답을 생성합니다.
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI 코드 리뷰 중 오류가 발생했습니다.");
        }
    }
}


