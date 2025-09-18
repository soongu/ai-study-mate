package com.study.mate.config;

import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;
import com.study.mate.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 레이트 리미트(Rate Limit)를 적용하기 위한 스프링 MVC 인터셉터입니다.
 *
 * 초보자 가이드
 * - 왜 필요한가?
 *   1) 비용 보호: LLM 호출은 토큰 사용량에 따라 비용이 발생합니다. 무분별한 요청/긴 요청은 비용 폭탄이 될 수 있습니다.
 *   2) 공정성: 특정 사용자가 과도하게 호출하면 다른 사용자 경험이 나빠집니다. 사용자별 한도를 두어 공정하게 나눕니다.
 *   3) 안정성: 갑작스런 트래픽 급증(예: 스팸/봇)으로 서버가 불안정해지는 것을 막습니다.
 *
 * 동작 개요
 * - 이 인터셉터는 컨트롤러가 실행되기 "이전"에 동작(preHandle).
 * - SecurityContext 에서 인증된 사용자 식별자(providerId; JWT subject)를 추출합니다.
 * - 요청 본문 길이를 직접 읽지 않고(Content-Length 헤더 기반) 대략적인 토큰 사용량을 추정합니다.
 * - {@link RateLimiterService#tryConsume(String, int)} 로 분당/일일 요청 수, 일일 토큰 한도를 함께 검사합니다.
 * - 한도를 초과하면 {@link BusinessException} 을 던져 요청을 즉시 차단합니다.
 *
 * 주의사항(학습 포인트)
 * - 현재 구현은 "인메모리" 카운터입니다. 서버 인스턴스가 여러 대일 경우 한도가 서버 간에 공유되지 않습니다.
 *   운영 환경에서는 Redis 같은 외부 저장소를 사용한 분산 레이트 리미팅으로 대체하세요.
 * - 토큰 추정은 매우 단순화된 근사치입니다. 모델/프롬프트/언어에 따라 실제 토큰 수는 달라질 수 있습니다.
 * - 이 인터셉터는 설정 클래스(WebMvcConfig)에서 "/api/ai/**" 경로에만 적용되도록 등록되어 있습니다.
 */
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiterService rateLimiterService; // 사용자별 요청/토큰 한도를 관리하는 서비스(인메모리)

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // (1) 인증 주체에서 providerId(subject) 추출: JwtAuthenticationFilter 가 미리 SecurityContext 를 채워둡니다.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            // 인증이 없다면 AI API 를 호출할 수 없습니다.
            throw new BusinessException(ErrorCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.getDefaultMessage());
        }
        String providerId = String.valueOf(auth.getPrincipal()); // 문자열 키로 사용

        // (2) 단순 토큰 추정: POST 요청의 Content-Length 헤더 기반(본문을 직접 읽지 않음)
        int estimatedTokens = 0;
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            int contentLength = request.getContentLength(); // 없으면 -1
            if (contentLength < 0) {
                String cl = request.getHeader("Content-Length");
                if (cl != null) {
                    try { contentLength = Integer.parseInt(cl); } catch (NumberFormatException ignore) { contentLength = -1; }
                }
            }
            if (contentLength > 0) {
                estimatedTokens = Math.max(0, contentLength / 4); // 매우 단순한 근사치: 4바이트 ≈ 1토큰
            }
        }

        // (3) 사용자별 레이트 리미트 소진 시도: 분당/일일 요청 수, 일일 토큰 한도 검사
        boolean allowed = rateLimiterService.tryConsume(providerId, estimatedTokens);
        if (!allowed) {
            // 한도 초과: GlobalExceptionHandler 가 429(Too Many Requests) 로 변환하여 클라이언트에 응답합니다.
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, ErrorCode.RATE_LIMIT_EXCEEDED.getDefaultMessage());
        }
        return true; // 허용: 컨트롤러로 진행
    }
}
