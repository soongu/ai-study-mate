package com.study.mate.dto;

import com.study.mate.entity.Provider;
import com.study.mate.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponseDto {
    private Long id;
    private String email;
    private String nickname;
    private String profileImageUrl;
    private Provider provider;
    private Long totalStudyTime; // 누적 학습 시간(분)
    private Integer studyRoomCount; // 참여한 스터디룸 개수

    public static UserResponseDto from(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .provider(user.getProvider())
                .totalStudyTime(user.getTotalStudyTime())
                .studyRoomCount(user.getStudyRoomCount())
                .build();
    }
}


