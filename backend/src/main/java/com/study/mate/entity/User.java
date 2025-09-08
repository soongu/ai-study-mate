package com.study.mate.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_email", columnNames = {"email"}),
                @UniqueConstraint(name = "uk_provider_provider_id", columnNames = {"provider", "provider_id"})
        }
)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Provider provider;

    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    @Builder.Default
    @Column(name = "total_study_time", nullable = false)
    private Long totalStudyTime = 0L; // 분 단위 누적 시간 등으로 사용

    @Builder.Default
    @Column(name = "study_room_count", nullable = false)
    private Integer studyRoomCount = 0;

    /**
     * 사용자 프로필 정보를 업데이트합니다.
     *
     * - 닉네임: null이 아닌 경우에만 변경됩니다.
     * - 프로필 이미지 URL: 전달된 값으로 그대로 설정됩니다(Null 허용).
     *
     * @param nickname          변경할 닉네임(Null이면 기존 값 유지)
     * @param profileImageUrl   변경할 프로필 이미지 URL(Null 가능)
     */
    public void updateProfile(String nickname, String profileImageUrl) {
        if (nickname != null) {
            this.nickname = nickname;
        }
        this.profileImageUrl = profileImageUrl;
    }

    /**
     * 누적 학습 시간을 분 단위로 증가시킵니다.
     *
     * 0 이하의 값이 전달되면 동작하지 않습니다.
     * 내부적으로 {@code totalStudyTime}은 분 단위로 관리됩니다.
     *
     * @param additionalMinutes 증가시킬 학습 시간(분)
     */
    public void increaseTotalStudyTime(long additionalMinutes) {
        if (additionalMinutes <= 0) {
            return;
        }
        this.totalStudyTime += additionalMinutes;
    }

    /**
     * 사용자가 생성/참여한 스터디룸 개수를 1 증가시킵니다.
     */
    public void increaseStudyRoomCount() {
        this.studyRoomCount++;
    }

    /**
     * 현재 이메일이 공급자 placeholder 도메인으로 저장된 경우, 실제 이메일로 교체합니다.
     * 예: "@kakao.local"로 끝나는 임시 이메일을 실제 이메일로 교체
     *
     * @param realEmail 실제 이메일(Null/blank 무시)
     * @param placeholderSuffix placeholder 도메인 접미사(예: "@kakao.local")
     */
    public void updateEmailIfPlaceholder(String realEmail, String placeholderSuffix) {
        if (realEmail == null || realEmail.isBlank()) {
            return;
        }
        if (this.email != null && placeholderSuffix != null && this.email.endsWith(placeholderSuffix)) {
            this.email = realEmail;
        }
    }
}


