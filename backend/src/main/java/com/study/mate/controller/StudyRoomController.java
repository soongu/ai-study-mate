package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.request.CreateRoomRequest;
import com.study.mate.dto.request.JoinRoomRequest;
import com.study.mate.dto.request.LeaveRoomRequest;
import com.study.mate.dto.response.JoinLeaveResponse;
import com.study.mate.dto.response.StudyRoomDetailResponse;
import com.study.mate.dto.response.StudyRoomListItemResponse;
import com.study.mate.dto.response.StudyRoomResponse;
import com.study.mate.service.StudyRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

/**
 * 스터디룸 REST 컨트롤러 (MVP)
 *
 * - 생성/목록/상세/참여/나가기 엔드포인트 제공
 * - 요청 본문은 Bean Validation(@Valid)으로 검증
 * - 응답은 {@link ApiResponse}로 표준화된 포맷으로 반환
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
public class StudyRoomController {

    private final StudyRoomService studyRoomService;

    /**
     * 스터디룸 생성
     *
     * @param request 스터디룸 생성 요청 DTO
     * @return 생성된 스터디룸 응답 DTO를 ApiResponse로 래핑하여 반환
     */
    @PostMapping
    public ApiResponse<StudyRoomResponse> create(@Valid @RequestBody CreateRoomRequest request) {
        log.info("[RoomCreate] hostUserId={}, title='{}'", request.hostUserId(), request.title());
        return ApiResponse.ok(studyRoomService.createRoom(request));
    }

    /**
     * 스터디룸 목록 조회 (참여자 수 포함)
     *
     * @param keyword 검색 키워드(제목/설명)
     * @param hostId  호스트 ID(선택)
     * @param pageable 페이지 정보
     * @return 페이징된 스터디룸 목록을 ApiResponse로 래핑하여 반환
     */
    @GetMapping
    public ApiResponse<Page<StudyRoomListItemResponse>> list(@RequestParam(required = false) String keyword,
                                                             @RequestParam(required = false) Long hostId,
                                                             Pageable pageable) {
        log.debug("[RoomList] keyword='{}', hostId={}, page={}~{}", keyword, hostId, pageable.getPageNumber(), pageable.getPageSize());
        return ApiResponse.ok(studyRoomService.listRooms(keyword, hostId, pageable));
    }

    /**
     * 스터디룸 상세 조회 (참여자 수 포함)
     *
     * @param id 스터디룸 ID
     * @return 상세 정보(없으면 null)를 ApiResponse로 래핑하여 반환
     */
    @GetMapping("/{id}")
    public ApiResponse<StudyRoomDetailResponse> detail(@PathVariable Long id) {
        log.debug("[RoomDetail] id={}", id);
        return ApiResponse.ok(studyRoomService.getRoomDetail(id).orElse(null));
    }

    /**
     * 스터디룸 참여
     *
     * @param id 경로 변수의 방 ID(검증 목적)
     * @param request 참여 요청 DTO (실제 로직은 request.roomId 사용)
     * @return 참여 결과 응답 DTO를 ApiResponse로 래핑하여 반환
     */
    @PostMapping("/{id}/join")
    public ApiResponse<JoinLeaveResponse> join(@PathVariable Long id, @Valid @RequestBody JoinRoomRequest request) {
        log.info("[RoomJoin] pathId={}, body.roomId={}, userId={}", id, request.roomId(), request.userId());
        if (!id.equals(request.roomId())) {
            log.warn("[RoomJoin] Path roomId and body roomId mismatch: {} vs {}", id, request.roomId());
            return ApiResponse.error("roomId mismatch");
        }
        return ApiResponse.ok(studyRoomService.joinRoom(request));
    }

    /**
     * 스터디룸 나가기
     *
     * @param id 경로 변수의 방 ID(검증 목적)
     * @param request 나가기 요청 DTO (실제 로직은 request.roomId 사용)
     * @return 나가기 결과 응답 DTO를 ApiResponse로 래핑하여 반환
     */
    @DeleteMapping("/{id}/leave")
    public ApiResponse<JoinLeaveResponse> leave(@PathVariable Long id, @Valid @RequestBody LeaveRoomRequest request) {
        log.info("[RoomLeave] pathId={}, body.roomId={}, userId={}", id, request.roomId(), request.userId());
        if (!id.equals(request.roomId())) {
            log.warn("[RoomLeave] Path roomId and body roomId mismatch: {} vs {}", id, request.roomId());
            return ApiResponse.error("roomId mismatch");
        }
        return ApiResponse.ok(studyRoomService.leaveRoom(request));
    }
}


