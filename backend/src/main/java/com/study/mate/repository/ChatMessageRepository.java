package com.study.mate.repository;

import com.study.mate.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 채팅 메시지 저장소 (JPA)
 *
 * - 방 아이디로 최근 메시지를 페이징 조회합니다.
 */
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 특정 방의 최근 메시지를 생성시각 내림차순으로 조회합니다.
     *
     * @param roomId   방 아이디
     * @param pageable 페이지/사이즈 정보 (예: PageRequest.of(0, 20))
     */
    @Query(
        "SELECT m FROM ChatMessage m WHERE m.room.id = :roomId ORDER BY m.createdAt DESC"
    )
    Page<ChatMessage> findRecentMessagesByRoomId(@Param("roomId") Long roomId, Pageable pageable);
}


