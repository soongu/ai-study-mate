package com.study.mate.config;

import com.study.mate.util.AppProperties;
import com.study.mate.util.CookieProperties;
import com.study.mate.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 로그인 실패 시 실행되는 핸들러.
 *
 * 동작
 * 1) 실패 원인을 로깅하고, 사용자 친화적 에러 메시지 구성
 * 2) 혹시 남아있을 수 있는 토큰 쿠키를 정리
 * 3) 프론트엔드 에러 페이지(또는 로그인 페이지)로 리다이렉트하며 메시지를 쿼리로 전달
 * 
 * - 실패 테스트방법: .env의 카카오 secret key를 잘못 입력하고 카카오 로그인
 *   /oauth2/authorization/kakao 로 접근해보세요!
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private final CookieUtil cookieUtil;
    private final AppProperties appProperties;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String rawMessage = exception.getMessage() == null ? "oauth2_login_failed" : exception.getMessage();
        log.warn("OAuth2 authentication failed: {}", rawMessage);

        // 쿠키 정리 (있다면)
        cookieUtil.deleteAccessTokenCookie(response);
        cookieUtil.deleteRefreshTokenCookie(response);

        String encodedMsg = URLEncoder.encode(rawMessage, StandardCharsets.UTF_8);
        String baseUrl = appProperties.getOauth2FailureRedirectUrl();
        String redirect = baseUrl.contains("?") ? baseUrl + "&error=" + encodedMsg : baseUrl + "?error=" + encodedMsg;
        response.sendRedirect(redirect);
    }
}


