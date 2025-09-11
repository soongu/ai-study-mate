package com.study.mate.config;

import com.study.mate.util.CookieUtil;
import com.study.mate.util.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * WebSocket 핸드셰이크 시 쿠키(JWT)로 사용자 인증을 시도하는 인터셉터.
 *
 * 설명:
 * - HTTP → WebSocket으로 "연결을 바꾸는 순간(핸드셰이크)"에, 브라우저는 쿠키를 함께 보냅니다.
 * - 우리는 그 쿠키에서 Access Token(JWT)을 꺼내 검증하고, 사용자를 식별해 둡니다.
 * - 이렇게 하면 STOMP 메시지를 보낼 때도 "누가 보냈는지"를 알 수 있습니다.
 */
@Component
@RequiredArgsConstructor
public class CookieAuthHandshakeInterceptor implements HandshakeInterceptor {

    private final CookieUtil cookieUtil;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(@NonNull ServerHttpRequest request,
                                   @NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler,
                                   @NonNull Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servlet) {
            HttpServletRequest httpRequest = servlet.getServletRequest();
            // 1) 쿠키에서 Access Token을 꺼냅니다.
            String token = cookieUtil.readAccessToken(httpRequest);
            if (token != null && jwtTokenProvider.validateToken(token)) {
                // 2) 토큰이 유효하면 사용자 식별값(subject)을 꺼냅니다.
                Claims claims = jwtTokenProvider.getClaims(token);
                String subject = claims.getSubject(); // 예: 사용자 ID/이메일

                // 3) 스프링 시큐리티 컨텍스트에 인증 정보를 심어둡니다.
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(subject, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);

                // 4) 이후 단계에서 Principal로 사용할 수 있도록 세션 속성에도 저장합니다.
                attributes.put("wsUser", subject);
            }
        }
        return true; // 인증 실패 시에도 연결 자체는 허용(토픽 접근은 채널 보안에서 통제)
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request,
                               @NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }
}


