package com.study.mate.util;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
// application.yml에서 jwt관련 프로퍼티 값을 읽어오는 클래스
public class JwtProperties {
    private String secret; // application.yml: jwt.secret
    private long accessExpiration;
    private long refreshExpiration;
}