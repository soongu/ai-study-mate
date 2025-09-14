package com.study.mate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

/**
 * STOMP 보안을 HTTP 스타일 DSL로 단순화.
 * - /app/** 로 보내는 전송(SEND)은 인증 필요
 * - /topic/**, /queue/** 구독(SUBSCRIBE)은 인증 필요
 * - 그 외 메시지는 거부
 */
@Configuration
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager() {
        MessageMatcherDelegatingAuthorizationManager.Builder builder =
            MessageMatcherDelegatingAuthorizationManager.builder();

        builder
            .simpDestMatchers("/app/**").authenticated()
            .simpSubscribeDestMatchers("/topic/**", "/queue/**").authenticated()
            .anyMessage().denyAll();

        return builder.build();
    }
}


