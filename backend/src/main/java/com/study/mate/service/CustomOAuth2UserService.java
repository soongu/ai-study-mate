package com.study.mate.service;

import com.study.mate.entity.Provider;
import com.study.mate.entity.User;
import com.study.mate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

/**
 * OAuth2 사용자 정보를 로드하고 우리 도메인 사용자로 동기화하는 서비스.
 *
 * 동작 개요
 * 1) 공급자(registrationId)에 따라 응답 스키마를 구분
 * 2) 사용자 식별자(providerId), 이메일/닉네임/프로필 이미지를 추출
 * 3) 기존 사용자면 프로필을 업데이트, 없으면 신규로 저장
 * 4) ROLE_USER 권한의 DefaultOAuth2User를 반환 (nameAttributeKey는 공급자별 상이)
 *
 * 주의
 * - 카카오는 응답 구조가 중첩되어 있어 안전 캐스팅과 널 처리(safeStr, coalesce)를 사용합니다.
 * - 반환되는 OAuth2User의 attributes는 원본 공급자 응답을 그대로 유지합니다.
 * 
 * 테스트 URL
 * - http://localhost:9005/oauth2/authorization/google
 * - http://localhost:9005/oauth2/authorization/kakao
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    /**
     * 공급자에서 사용자 정보를 조회하고, 우리 DB와 동기화한 뒤 OAuth2User를 반환합니다.
     *
     * 절차
     * - super.loadUser(...)로 공급자 사용자 정보 조회
     * - registrationId(google|kakao)로 공급자를 식별
     * - 공급자별 스키마에 맞게 주요 필드 추출 (providerId, email, nickname, profileImageUrl)
     * - 기존 사용자 → 프로필 업데이트, 신규 사용자 → 저장
     * - nameAttributeKey를 공급자별로 맞춰 DefaultOAuth2User 구성
     */
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Provider provider = resolveProvider(registrationId);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId;
        String email;
        String nickname;
        String profileImageUrl;

        // Google 응답 스키마: https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
        if (provider == Provider.GOOGLE) {
            providerId = String.valueOf(attributes.get("sub"));
            email = safeStr(attributes.get("email"));
            nickname = coalesce(safeStr(attributes.get("name")), email != null ? email.split("@")[0] : null);
            profileImageUrl = safeStr(attributes.get("picture"));
        // Kakao 응답 스키마: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info
        } else if (provider == Provider.KAKAO) {
            providerId = String.valueOf(attributes.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.getOrDefault("kakao_account", Collections.emptyMap());
            email = safeStr(kakaoAccount.get("email"));
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.getOrDefault("profile", Collections.emptyMap());
            nickname = coalesce(safeStr(profile.get("nickname")), email != null ? email.split("@")[0] : null);
            profileImageUrl = safeStr(profile.get("profile_image_url"));
        } else {
            throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
        }

        // 카카오 이메일 미동의 시(DB 제약 nullable=false) placeholder 이메일로 대체하여 사용
        final String effectiveEmail = (provider == Provider.KAKAO && (email == null || email.isBlank()))
                ? (providerId + "@kakao.local")
                : email;

        Optional<User> existing = userRepository.findByProviderAndProviderId(provider, providerId);
        User user = existing.map(u -> {
            u.updateProfile(nickname, profileImageUrl);
            // 기존 사용자가 placeholder 이메일 상태이고, 이후 실제 이메일을 가져오게 된 경우 교체
            u.updateEmailIfPlaceholder(effectiveEmail, "@kakao.local");
            return u;
        }).orElseGet(() -> User.builder()
                .email(effectiveEmail)
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .provider(provider)
                .providerId(providerId)
                .build());

        userRepository.save(user);

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                resolveNameAttributeKey(registrationId)
        );
    }

    /**
     * registrationId(google|kakao)를 도메인 Provider enum으로 변환합니다.
     */
    private Provider resolveProvider(String registrationId) {
        String id = registrationId == null ? "" : registrationId.toLowerCase();
        return switch (id) {
            case "google" -> Provider.GOOGLE;
            case "kakao" -> Provider.KAKAO;
            default -> throw new IllegalArgumentException("Unknown provider: " + registrationId);
        };
    }

    /**
     * Spring Security가 principal의 name으로 사용할 attribute key를 공급자별로 반환합니다.
     * - Google: sub (OpenID Connect 표준 subject)
     * - Kakao: id
     */
    private String resolveNameAttributeKey(String registrationId) {
        String id = registrationId == null ? "" : registrationId.toLowerCase();
        return switch (id) {
            case "google" -> "sub";
            case "kakao" -> "id";
            default -> "id";
        };
    }

    /**
     * 객체를 null-safe하게 문자열로 변환합니다. null이면 null을 반환합니다.
     */
    private String safeStr(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    /**
     * 첫 번째 인자가 비어있지 않으면 그대로, 아니면 두 번째 인자를 반환합니다.
     */
    private String coalesce(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }
}


