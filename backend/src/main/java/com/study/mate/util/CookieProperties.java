package com.study.mate.util;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "cookie")
public class CookieProperties {
    private String domain;
    private boolean secure;
    private boolean httpOnly;
    private String sameSite; // Lax, Strict, None
    private String accessTokenName;
    private String refreshTokenName;
    private int accessMaxAge; // seconds
    private int refreshMaxAge; // seconds
}


