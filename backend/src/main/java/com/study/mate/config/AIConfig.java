package com.study.mate.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        // ChatClient.Builder 는 Spring AI가 자동 구성합니다.
        // application.yml 의 spring.ai.openai.* 옵션을 사용해 빌드됩니다.
        return builder.build();
    }
}


