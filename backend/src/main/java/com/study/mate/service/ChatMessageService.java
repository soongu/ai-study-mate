package com.study.mate.service;

import com.study.mate.dto.response.ChatMessageResponse;
import com.study.mate.entity.ChatMessage;
import com.study.mate.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 채팅 메시지 조회 서비스 (MVP: 최근 메시지 페이징만)
 */
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;

    /**
     * 방의 최근 메시지를 페이징으로 조회합니다(최신순).
     */
    public List<ChatMessageResponse> getRecentMessages(Long roomId, Pageable pageable) {
        Page<ChatMessage> page = chatMessageRepository.findRecentMessagesByRoomId(roomId, pageable);
        return page.map(ChatMessageResponse::from).getContent();
    }
}


