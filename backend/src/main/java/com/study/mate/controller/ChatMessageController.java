package com.study.mate.controller;

import com.study.mate.dto.ApiResponse;
import com.study.mate.dto.response.ChatMessageResponse;
import com.study.mate.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 최근 채팅 메시지 REST 조회 컨트롤러 (MVP)
 *
 *  설명:
 * - WebSocket이 "실시간"이라면, 이 REST API는 "과거 기록"을 불러오는 용도입니다.
 * - 예: 방에 들어가자마자 최근 20개 메시지를 먼저 보여준 후, 실시간 메시지를 이어받습니다.
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    /**
     * GET /api/rooms/{roomId}/messages?size=20&page=0
     * - 최근 메시지를 최신순으로 size개 반환합니다.
     */
    @GetMapping("/{roomId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getRecentMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        List<ChatMessageResponse> messages = chatMessageService.getRecentMessages(roomId, pageable);
        return ApiResponse.ok(messages);
    }
}


