package com.study.mate.dto.response;

import com.study.mate.entity.StudyRoom;
import lombok.Builder;

/**
 * 스터디룸 조회/응답 DTO (Java record).
 */
@Builder
public record StudyRoomResponse(Long id, String title, String description, Long hostId, String hostNickname) {

    /**
     * StudyRoom 엔티티와 호스트 정보로 응답 DTO를 생성하는 정적 팩토리 메서드.
     */
    public static StudyRoomResponse from(StudyRoom room) {
        return StudyRoomResponse.builder()
                .id(room.getId())
                .title(room.getTitle())
                .description(room.getDescription())
                .hostId(room.getHost().getId())
                .hostNickname(room.getHost().getNickname())
                .build();
    }
}


