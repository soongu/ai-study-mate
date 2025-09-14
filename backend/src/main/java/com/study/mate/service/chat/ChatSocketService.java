package com.study.mate.service.chat;

import com.study.mate.dto.request.ChatSendRequest;
import com.study.mate.dto.response.ChatMessageResponse;
import com.study.mate.entity.ChatMessage;
import com.study.mate.entity.StudyRoom;
import com.study.mate.entity.User;
import com.study.mate.repository.ChatMessageRepository;
import com.study.mate.repository.StudyRoomRepository;
import com.study.mate.repository.RoomParticipantRepository;
import com.study.mate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WebSocket(STOMP) 채팅 도메인 서비스
 *
 * 무엇을 하나요?
 * - 브라우저가 STOMP로 보낸 채팅 메시지를 "DB에 저장"하고,
 *   같은 방을 구독한 사람들에게 "브로드캐스트"(배포)합니다.
 *
 * 왜 컨트롤러가 아닌 서비스에서 하나요?
 * - 컨트롤러는 최대한 얇게 유지(입력만 받고 위임).
 * - 저장(트랜잭션) + 방송(메시징) 같은 도메인 로직은 서비스에서 담당하면
 *   재사용/테스트/유지보수가 쉬워집니다.
 *
 * 작은 용어 정리
 * - STOMP: WebSocket 위에서 "주소 체계"로 메시지를 주고받게 해주는 규칙.
 *   (예: 전송 주소 /app/rooms/{id}/chat, 구독 주소 /topic/rooms/{id})
 * - 브로드캐스트: 특정 방을 구독한 모두에게 같은 메시지를 뿌리는 것.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChatSocketService {

    // STOMP 구독자에게 메시지를 보내는 스프링 헬퍼(우체부 역할)
    private final SimpMessagingTemplate messagingTemplate;
    // 채팅 메시지를 DB에 저장/조회하는 JPA 저장소
    private final ChatMessageRepository chatMessageRepository;
    // 방(StudyRoom) 정보를 DB에서 찾는 저장소
    private final StudyRoomRepository studyRoomRepository;
    // 보낸 사람(User) 정보를 DB에서 찾는 저장소
    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    /**
     * 채팅 메시지를 저장하고, 구독자에게 브로드캐스트합니다.
     * @param roomId 방 아이디
     * @param request { content }
     * @param providerId 인증 주체 식별자(subject)
     */
    public void saveAndBroadcast(Long roomId, ChatSendRequest request, String providerId) {
        // 1) 내용 검증: 비어있는 메시지는 저장/발송하지 않습니다.
        if (request == null || request.content() == null || request.content().isBlank()) return;

        // 2) 보낸 사람 조회: 핸드셰이크 시 인증된 providerId로 User를 찾습니다.
        User sender = userRepository.findByProviderId(providerId).orElse(null);
        if (sender == null) return;

        // 3) 대상 방 조회: 존재하지 않는 방이라면 중단합니다.
        StudyRoom room = studyRoomRepository.findById(roomId).orElse(null);
        if (room == null) return;

        // 3-1) 권한 검증: 이 유저가 이 방의 참여자인지 확인(입장하지 않은 사용자는 전송 불가)
        boolean joined = roomParticipantRepository.findByRoomIdAndUserId(roomId, sender.getId()).isPresent();
        if (!joined) return;

        // 4) 메시지 저장: 누가(room/sender) 무엇을(content) 말했는지 기록합니다.
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(request.content())
                .build());

        // 5) 브로드캐스트: 같은 방 토픽을 구독한 모두에게 전송합니다.
        //    - 구독 주소 규칙: /topic/rooms/{roomId}
        //    - 프론트는 client.subscribe('/topic/rooms/1', handler) 형태로 받습니다.
        ChatMessageResponse payload = ChatMessageResponse.from(saved);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, payload);
    }
}


