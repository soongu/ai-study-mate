package com.study.mate.repository;

import com.study.mate.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

  
    /**
     * 특정 스터디룸(roomId)에 속한 모든 RoomParticipant(참여기록) 목록을 조회합니다.
     *
     * @param roomId 스터디룸의 ID
     * @return 해당 스터디룸에 참여한 RoomParticipant 리스트
     */
    List<RoomParticipant> findByRoomId(Long roomId);

    
    /**
     * 특정 유저(userId)가 참여한 모든 RoomParticipant(참여기록) 목록을 조회합니다.
     *
     * @param userId 유저의 ID
     * @return 해당 유저가 참여한 RoomParticipant 리스트
     */
    List<RoomParticipant> findByUserId(Long userId);

    
    /**
     * 특정 스터디룸(roomId)과 유저(userId)에 해당하는 RoomParticipant(참여기록)를 조회합니다.
     *
     * @param roomId 스터디룸의 ID
     * @param userId 유저의 ID
     * @return 해당 스터디룸에 해당 유저가 참여한 RoomParticipant (Optional)
     */
    Optional<RoomParticipant> findByRoomIdAndUserId(Long roomId, Long userId);

    /**
     * 특정 스터디룸(roomId)에 참여한 RoomParticipant(참여자) 수를 반환합니다.
     *
     * @param roomId 스터디룸의 ID
     * @return 해당 스터디룸에 참여한 인원 수
     */
    long countByRoomId(Long roomId);

    /**
     * 특정 유저(userId)가 현재 참여 중인 스터디룸 수를 반환합니다.
     */
    long countByUserId(Long userId);

    /**
     * 특정 스터디룸(roomId)에 참여한 모든 사용자의 providerId 목록을 조회합니다.
     * SSE 알림 전송 시 해당 룸의 모든 참여자에게 알림을 보내기 위해 사용됩니다.
     *
     * @param roomId 스터디룸의 ID
     * @return 해당 스터디룸에 참여한 사용자들의 providerId 리스트
     */
    @Query("SELECT u.providerId FROM RoomParticipant rp JOIN rp.user u WHERE rp.room.id = :roomId")
    List<String> findParticipantProviderIds(@Param("roomId") Long roomId);
}


