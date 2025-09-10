package com.study.mate.dto.response;

import com.study.mate.repository.dto.StudyRoomWithParticipantCount;
import lombok.Builder;

@Builder
public record StudyRoomListItemResponse(Long id, String title, String description, Long participantCount) {

    public static StudyRoomListItemResponse from(StudyRoomWithParticipantCount src) {
        return StudyRoomListItemResponse.builder()
                .id(src.getId())
                .title(src.getTitle())
                .description(src.getDescription())
                .participantCount(src.getParticipantCount())
                .build();
    }
}


