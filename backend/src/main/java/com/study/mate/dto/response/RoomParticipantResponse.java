package com.study.mate.dto.response;

import com.study.mate.entity.ParticipantRole;
import com.study.mate.entity.ParticipantStatus;
import com.study.mate.entity.RoomParticipant;
import lombok.Builder;

@Builder
public record RoomParticipantResponse(
        Long id,
        Long userId,
        String nickname,
        String profileImageUrl,
        ParticipantRole role,
        ParticipantStatus status
) {
    public static RoomParticipantResponse from(RoomParticipant rp) {
        return RoomParticipantResponse.builder()
                .id(rp.getId())
                .userId(rp.getUser().getId())
                .nickname(rp.getUser().getNickname())
                .profileImageUrl(rp.getUser().getProfileImageUrl())
                .role(rp.getRole())
                .status(rp.getStatus())
                .build();
    }
}


