package com.study.mate.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * HTTP-Only 쿠키 생성/삭제 유틸리티.
 *
 * - 보안 플래그(HttpOnly, Secure, SameSite, Domain, Path)를 일관되게 적용합니다.
 * - SameSite=None일 경우, 브라우저 정책상 Secure=true가 요구됩니다(운영에서 적용).
 * - 개발 환경에서는 보통 http://localhost 이므로 Secure=false로 설정합니다.
 */
@Component
@RequiredArgsConstructor
public class CookieUtil {

    private final CookieProperties props;

    /**
     * Access Token 쿠키를 추가합니다.
     * @param response 응답 객체
     * @param token    액세스 토큰 값
     */
    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = buildCookie(props.getAccessTokenName(), token, props.getAccessMaxAge());
        setCookieHeader(response, cookie);
    }

    /**
     * Refresh Token 쿠키를 추가합니다.
     * @param response 응답 객체
     * @param token    리프레시 토큰 값
     */
    public void addRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = buildCookie(props.getRefreshTokenName(), token, props.getRefreshMaxAge());
        setCookieHeader(response, cookie);
    }

    public void deleteAccessTokenCookie(HttpServletResponse response) {
        deleteCookie(response, props.getAccessTokenName());
    }

    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        deleteCookie(response, props.getRefreshTokenName());
    }

    /**
     * 요청에서 지정한 이름의 쿠키 값을 조회합니다.
     * @param request 요청
     * @param name 쿠키 이름
     * @return 값(없으면 null)
     */
    public String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    /**
     * 요청에서 Access Token 쿠키 값을 조회합니다.
     */
    public String readAccessToken(HttpServletRequest request) {
        return readCookie(request, props.getAccessTokenName());
    }

    /**
     * 요청에서 Refresh Token 쿠키 값을 조회합니다.
     */
    public String readRefreshToken(HttpServletRequest request) {
        return readCookie(request, props.getRefreshTokenName());
    }

    /**
     * 지정한 쿠키를 삭제합니다(max-age=0).
     */
    private void deleteCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = buildCookie(name, "", 0);
        setCookieHeader(response, cookie);
    }

    /**
     * 공통 쿠키 빌더. 보안 플래그와 도메인, 경로 등을 일관 적용합니다.
     */
    private ResponseCookie buildCookie(String name, String value, int maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(props.isHttpOnly())
                .secure(props.isSecure())
                .domain(props.getDomain())
                .path("/")
                .sameSite(props.getSameSite())
                .maxAge(maxAgeSeconds)
                .build();
    }

    /**
     * Set-Cookie 헤더에 쿠키를 추가합니다.
     */
    private void setCookieHeader(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader("Set-Cookie", cookie.toString());
    }
}


