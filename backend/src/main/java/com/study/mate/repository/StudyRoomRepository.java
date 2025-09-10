package com.study.mate.repository;

import com.study.mate.entity.StudyRoom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
    

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Long> {

    /**
     * 특정 호스트(유저)가 생성한 스터디룸 목록을 조회합니다.
     * 
     * @param hostId 호스트(유저)의 ID
     * @return 해당 호스트가 생성한 StudyRoom 리스트
     */
    List<StudyRoom> findByHostId(Long hostId);

    /**
     * 생성일시(createdAt) 기준으로 내림차순 정렬된 스터디룸 목록을 페이징하여 조회합니다.
     * 
     * @param pageable 페이징 정보
     * @return 생성일시 기준 내림차순 정렬된 StudyRoom 페이지
     */
    @Query("select r from StudyRoom r order by r.createdAt desc")
    Page<StudyRoom> findAllOrderByCreatedAtDesc(Pageable pageable);


    
    /**
     * 수정일시(updatedAt) 기준으로 내림차순 정렬된 스터디룸 목록을 페이징하여 조회합니다.
     * 
     * @param pageable 페이징 정보
     * @return 수정일시 기준 내림차순 정렬된 StudyRoom 페이지
     */
    @Query("select r from StudyRoom r order by r.updatedAt desc")
    Page<StudyRoom> findAllOrderByUpdatedAtDesc(Pageable pageable);
}


