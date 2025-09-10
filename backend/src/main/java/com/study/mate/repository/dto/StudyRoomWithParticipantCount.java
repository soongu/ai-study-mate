package com.study.mate.repository.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudyRoomWithParticipantCount {
    private Long id;
    private String title;
    private String description;
    private Long participantCount;
}


