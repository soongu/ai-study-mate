package com.study.mate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.study.mate.service.CustomOAuth2UserService;

import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * 애플리케이션 전역 보안 설정 클래스.
 *
 * - 이 서비스는 세션을 사용하지 않고(JWT 쿠키 기반) 완전한 Stateless로 동작합니다.
 * - 개발 편의를 위해 일부 퍼블릭 엔드포인트(`/, /health, /h2-console/**, /api/auth/**`)는 인증 없이 접근을 허용합니다.
 * - CSRF는 비활성화하며, 인증 실패 시 401을 반환하도록 구성합니다.
 * - CORS는 프론트엔드(예: Vite 개발 서버)에서의 요청을 허용하도록 설정합니다.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    /**
     * HTTP 보안 체인 구성.
     *
     * - CORS: 프론트엔드 도메인에서의 요청 허용
     * - CSRF: 비활성화 (JWT 기반, 세션 미사용)
     * - 세션: STATELESS (서버가 세션 상태를 저장하지 않음)
     * - 폼/기본 인증: 비활성화 (우리는 쿠키+JWT 조합 사용)
     * - 헤더: H2 콘솔이 iframe으로 열리도록 sameOrigin 허용
     * - 권한: 퍼블릭 경로만 허용, 그 외는 인증 필요
     * - 예외: 인증 실패 시 401 반환
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            // 프론트엔드 개발 서버 및 지정된 오리진만 허용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // JWT 쿠키 기반이므로 CSRF는 사용하지 않음
            .csrf(csrf -> csrf.disable())
            // 완전한 무상태(Stateless)로 동작
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 기본 제공 로그인/기본 인증은 사용하지 않음
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            // H2 콘솔 접근을 위해 동일 출처 iframe 허용
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            // 엔드포인트 권한 정책: 퍼블릭 → 허용, 나머지 → 인증 필요
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/health", "/", "/h2-console/**").permitAll()
                // OpenAPI(Swagger UI) 공개 경로
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**"
                ).permitAll()
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/oauth2/**").permitAll()
                .anyRequest().authenticated()
            )
            // OAuth2 로그인 활성화 및 사용자 정보 서비스/성공/실패 핸들러 연결
            .oauth2Login(oauth -> oauth
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            // 인증 실패 시 401 Unauthorized 반환
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendError(401))
            )
            // UsernamePasswordAuthenticationFilter 전에 JWT 필터 동작
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS 설정.
     *
     * - 개발 중에는 Vite/CRA 개발 서버를 허용합니다.
     * - 운영 배포 시, 실제 프론트엔드 도메인(예: https://app.example.com)을 추가하세요.
     * - 크리덴셜(withCredentials) 전송을 허용합니다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
