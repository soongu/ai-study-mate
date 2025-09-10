package com.study.mate.service;

import com.study.mate.entity.ParticipantRole;
import com.study.mate.entity.ParticipantStatus;
import com.study.mate.entity.RoomParticipant;
import com.study.mate.entity.StudyRoom;
import com.study.mate.entity.User;
import com.study.mate.dto.request.CreateRoomRequest;
import com.study.mate.dto.response.StudyRoomResponse;
import com.study.mate.exception.BusinessException;
import com.study.mate.exception.ErrorCode;
import com.study.mate.repository.RoomParticipantRepository;
import com.study.mate.repository.StudyRoomRepository;
import com.study.mate.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 스터디룸 관련 비즈니스 로직을 담당하는 서비스.
 *
 * - 트랜잭션: 클래스 레벨의 {@link Transactional} 로 메서드 기본 트랜잭션을 보장합니다.
 * - 책임: 방 생성, 호스트 자동 참여 처리 등 스터디룸 도메인의 핵심 흐름을 Orchestrate 합니다.
 * - DTO 원칙: 서비스 레이어는 요청/응답에 DTO(record)를 사용하며, 컨트롤러에서 {@code ApiResponse}로 래핑합니다.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class StudyRoomService {

    private final StudyRoomRepository studyRoomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final UserRepository userRepository;

    
    /**
     * 스터디룸을 생성하고, 생성자를 호스트로 자동 참여시킵니다.
     *
     * 입력/출력은 서비스 레이어에서 DTO(record)를 사용합니다.
     * 컨트롤러에서는 반환값을 {@code ApiResponse.ok(...)}로 래핑하여 응답합니다.
     *
     * @param request 스터디룸 생성 요청 DTO
     * @return 생성된 스터디룸 응답 DTO
     * @throws BusinessException {@link ErrorCode#USER_NOT_FOUND} 사용자를 찾지 못한 경우
     */
    public StudyRoomResponse createRoom(CreateRoomRequest request) {
        // 1) 호스트 사용자 조회 및 검증
        User host = userRepository.findById(request.hostUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 2) 스터디룸 엔티티 생성
        //    - maxParticipants는 엔티티에서 4로 고정됩니다(PrePersist 및 기본값).
        StudyRoom room = StudyRoom.builder()
                .title(request.title())
                .description(request.description())
                .host(host)
                .build();

        // 3) 스터디룸 저장
        StudyRoom saved = studyRoomRepository.save(room);

        // 4) 호스트를 참여자로 자동 등록
        //    - 역할: HOST, 상태: ONLINE (생성 직후 접속 중으로 가정)
        RoomParticipant hostParticipation = RoomParticipant.builder()
                .room(saved)
                .user(host)
                .role(ParticipantRole.HOST)
                .status(ParticipantStatus.ONLINE)
                .build();
        // 5) 참여 기록 저장
        roomParticipantRepository.save(hostParticipation);

        // 6) 생성된 스터디룸을 응답 DTO로 반환(정적 팩토리 사용)
        return StudyRoomResponse.from(saved);
    }
}


