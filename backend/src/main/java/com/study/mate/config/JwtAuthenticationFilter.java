package com.study.mate.config;

import com.study.mate.util.CookieProperties;
import com.study.mate.util.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 인증 필터.
 *
 * 이 필터는 매 요청마다 한 번(OncePerRequest) 실행됩니다.
 * - 토큰 추출: 우선순위 1) Authorization 헤더의 Bearer 토큰, 2) HTTP-Only 쿠키(ACCESS_TOKEN)
 * - 토큰 검증: 서명/만료를 검증합니다.
 * - 컨텍스트 설정: 유효한 토큰이면 {@link SecurityContextHolder}에 인증 객체를 저장합니다.
 * - 비유효/부재: 아무런 설정 없이 다음 필터로 흐름을 넘깁니다.
 *
 * 주의사항
 * - Refresh Token은 이 필터에서 사용하지 않습니다(재발급 전용이므로 별도 엔드포인트에서 처리).
 * - 이미 인증 컨텍스트가 있는 경우(체인 상 다른 필터 등) 재설정하지 않습니다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieProperties cookieProperties;

    /**
     * 요청에서 액세스 토큰을 찾아 검증 후, 인증 컨텍스트를 구성합니다.
     *
     * @param request  HTTP 요청
     * @param response HTTP 응답
     * @param filterChain 다음 필터로 전달하기 위한 체인
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        // 토큰이 존재하고 유효하며, 아직 인증 컨텍스트가 비어있을 때만 설정합니다.
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            Claims claims = jwtTokenProvider.getClaims(token);
            String subject = claims.getSubject(); // 일반적으로 사용자 식별자

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    subject,
                    null,
                    Collections.emptyList()
            );
            ((UsernamePasswordAuthenticationToken) authentication)
                    .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 요청에서 액세스 토큰을 추출합니다.
     *
     * 우선순위
     * 1) Authorization 헤더의 Bearer 스킴: "Authorization: Bearer <token>"
     * 2) HTTP-Only 쿠키: 이름은 설정값(cookie.access-token-name)
     *
     * @param request HTTP 요청
     * @return 액세스 토큰(없으면 null)
     */
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieProperties.getAccessTokenName().equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}


