package com.study.mate.repository;

import com.study.mate.repository.dto.StudyRoomWithParticipantCount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface StudyRoomRepositoryCustom {

    /**
     * 키워드(제목/설명)와 호스트 ID로 스터디룸을 검색하고, 각 스터디룸의 참여자 수를 함께 조회합니다.
     *
     * @param keyword  검색할 키워드(제목 또는 설명)
     * @param hostId   호스트(방장) ID (null이면 전체 검색)
     * @param pageable 페이징 정보
     * @return 참여자 수가 포함된 StudyRoomWithParticipantCount의 페이지
     */
    Page<StudyRoomWithParticipantCount> searchRooms(String keyword, Long hostId, Pageable pageable);

    /**
     * 스터디룸 ID로 스터디룸을 조회하고, 해당 스터디룸의 참여자 수를 함께 반환합니다.
     *
     * @param roomId 스터디룸 ID
     * @return 참여자 수가 포함된 StudyRoomWithParticipantCount (Optional)
     */
    Optional<StudyRoomWithParticipantCount> findByIdWithParticipantCount(Long roomId);

}


