package com.study.mate.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

/**
 * JWT 생성/검증 유틸리티.
 *
 * - 시크릿과 만료시간은 {@link JwtProperties}에서 주입됩니다.
 * - 시크릿 키는 Base64 문자열을 디코딩해 HMAC-SHA Key로 생성합니다.
 * - 만료시간 단위는 밀리초(ms)입니다.
 */
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    // 비밀키를 생성
    private SecretKey key;

    /**
     * 애플리케이션 시작 시 시크릿 키 초기화.
     */
    @PostConstruct
    public void init() {
        // Base64로 인코딩된 키를 디코딩해 SecretKey 생성
        this.key = toSecretKey(jwtProperties.getSecret());
    }

    /**
     * Base64 시크릿을 HMAC-SHA 서명 키로 변환.
     * @param base64Secret Base64 인코딩된 시크릿
     * @return SecretKey
     */
    private SecretKey toSecretKey(String base64Secret) {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    }

    /**
     * 공통 토큰 생성 헬퍼.
     * @param subject 토큰 주체(예: 사용자 식별자)
     * @param claims 커스텀 클레임(Access Token에 최소한으로 포함)
     * @param expirationMillis 만료시간(ms)
     */
    private String createToken(String subject, Map<String, Object> claims, long expirationMillis) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /**
     * 서명 검증 후 Claims 파싱.
     * @param token JWT
     * @return Claims
     */
    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }


    /**
     * Access Token 생성.
     * - 클라이언트 표시/권한 확인용 최소 정보만 클레임에 포함 권장.
     */
    public String createAccessToken(String subject, Map<String, Object> claims) {
        return createToken(subject, claims, jwtProperties.getAccessExpiration());
    }

    /**
     * Refresh Token 생성.
     * - 커스텀 클레임을 넣지 않는 이유:
     *   1) 최소 권한 원칙: 재발급 용도로만 사용.
     *   2) 유출 피해 축소: 불필요한 사용자 정보 노출 방지.
     *   3) 로테이션/블랙리스트 설계와의 궁합상 식별 최소화가 유리.
     */
    public String createRefreshToken(String subject) {
        return createToken(subject, Map.of(), jwtProperties.getRefreshExpiration());
    }

    /**
     * 토큰 유효성 검증(서명/만료).
     * @return 유효하면 true
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 토큰에서 Claims 추출(유효하지 않으면 예외).
     */
    public Claims getClaims(String token) {
        return parseClaims(token);
    }
}


