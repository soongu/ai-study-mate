package com.study.mate.service.chat;

import com.study.mate.entity.ChatMessage;
import com.study.mate.entity.StudyRoom;
import com.study.mate.entity.User;
import com.study.mate.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 채팅 메시지 저장 전용 서비스
 *
 * 역할
 * - 누가(sender)가 어느 방(room)에서 어떤 내용(content)을 보냈는지 DB에 "저장"만 담당합니다.
 * - 트랜잭션 경계도 여기서 관리합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatMessageWriteService {

    private final ChatMessageRepository chatMessageRepository;

    /**
     * 채팅 메시지를 생성/저장하고 영속화된 엔티티를 반환합니다.
     * - 유효성 검사는 상위 계층(오케스트레이터)에서 완료되었다고 가정합니다.
     */
    public ChatMessage save(StudyRoom room, User sender, String content) {
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
            .room(room)
            .sender(sender)
            .content(content)
            .build());
        log.debug("채팅 저장 성공: roomId={}, senderId={}, msgId={}",
            room.getId(), sender.getId(), saved.getId());
        return saved;
    }
}


