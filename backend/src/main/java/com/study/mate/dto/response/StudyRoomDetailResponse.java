package com.study.mate.dto.response;

import com.study.mate.repository.dto.StudyRoomWithParticipantCount;
import lombok.Builder;

@Builder
public record StudyRoomDetailResponse(Long id, String title, String description, Long participantCount) {

    public static StudyRoomDetailResponse from(StudyRoomWithParticipantCount src) {
        return StudyRoomDetailResponse.builder()
                .id(src.getId())
                .title(src.getTitle())
                .description(src.getDescription())
                .participantCount(src.getParticipantCount())
                .build();
    }
}


